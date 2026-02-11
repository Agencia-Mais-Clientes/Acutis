// Serviço de análise de conversas

import { supabaseAdmin } from "@/lib/supabase";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type {
  MensagemCliente,
  ChatAtivo,
  TranscricaoFormatada,
  ConfigEmpresa,
  OrigemFilter,
} from "@/lib/analyze-types";
import type { ResultadoIA } from "@/lib/types";
import { calcularTempoRespostaJusto } from "@/lib/business-hours";

// ============================================
// CONSTANTES
// ============================================

// Origens consideradas como tráfego pago
const ORIGENS_TRAFEGO_PAGO = ["facebook_ads", "instagram_ads", "google_ads"];

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Sleep function para delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry com backoff exponencial
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  baseDelayMs = 5000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`[RETRY] Tentativa ${attempt}/${maxRetries} falhou: ${lastError.message}`);

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1); // 2s, 4s, 8s
        console.log(`[RETRY] Aguardando ${delay}ms antes de tentar novamente...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// ============================================
// QUERIES DE BUSCA
// ============================================

/**
 * Busca todas as empresas ativas para processar
 */
export async function getActiveCompanies(): Promise<ConfigEmpresa[]> {
  const { data, error } = await supabaseAdmin
    .from("config_empresas")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[ANALYZE] Erro ao buscar empresas:", error);
    return [];
  }

  // Filtra empresas ativas (se o campo existir)
  return (data as ConfigEmpresa[]).filter((c) => c.ativo !== false);
}

/**
 * Busca chats ativos com mensagens novas desde a última análise
 * Inclui chats NUNCA analisados e chats com mensagens NOVAS
 */
export async function getActiveChatsWithoutAnalysis(
  ownerId?: string,
  limit = 50
): Promise<ChatAtivo[]> {
  // Query: busca chats que nunca foram analisados OU que têm mensagens
  // com ID maior que o msg_fim_id da última análise
  const query = `
    SELECT DISTINCT m.owner, m.chatid
    FROM public.mensagens_clientes m
    INNER JOIN public.config_empresas c ON m.owner = c.owner
    LEFT JOIN LATERAL (
      SELECT a.msg_fim_id
      FROM public.analises_conversas a
      WHERE a.chatid = m.chatid
      ORDER BY a.created_at DESC
      LIMIT 1
    ) last_analysis ON TRUE
    WHERE 
        m.recebido_em >= (NOW() - INTERVAL '30 days') 
        AND m.chatid NOT LIKE '%@g.us'
        AND m.chatid IS NOT NULL
        AND m.chatid != ''
        AND (
          last_analysis.msg_fim_id IS NULL
          OR m.id > last_analysis.msg_fim_id
        )
        ${ownerId ? `AND m.owner = '${ownerId}'` : ""}
    ORDER BY m.chatid
    LIMIT ${limit};
  `;

  const { data, error } = await supabaseAdmin.rpc("exec_sql", { query_text: query });

  if (error) {
    // Fallback: usar query Supabase normal se RPC não existir
    console.log("[ANALYZE] RPC não disponível, usando query alternativa");
    return getActiveChatsWithoutAnalysisFallback(ownerId, limit);
  }

  return data as ChatAtivo[];
}

/**
 * Fallback usando queries Supabase normais
 * Suporta filtro por origem de tráfego
 */
export async function getActiveChatsWithoutAnalysisFallback(
  ownerId?: string,
  limit = 50,
  origemFilter: OrigemFilter = "todos",
  fromDate?: string
): Promise<ChatAtivo[]> {
  // Para filtro de origem, usa DUAS fontes:
  // 1. chatids do lead_tracking (match direto)
  // 2. flag eh_primeiro_contato_ads na mensagens_clientes (resolve mismatch LID/telefone)
  let chatidsElegiveis: string[] | null = null;
  
  if (origemFilter !== "todos") {
    const origensPermitidas = origemFilter === "trafego_pago" 
      ? ORIGENS_TRAFEGO_PAGO 
      : ["organico"];
    
    let trackingQuery = supabaseAdmin
      .from("lead_tracking")
      .select("chatid")
      .in("origem", origensPermitidas);
    
    if (ownerId) {
      trackingQuery = trackingQuery.eq("owner", ownerId);
    }
    
    const { data: trackedChats, error: trackingError } = await trackingQuery;
    
    if (trackingError) {
      console.error("[ANALYZE] Erro ao buscar lead_tracking:", trackingError);
      if (!trackingError.message?.includes("does not exist")) {
        return [];
      }
    } else if (trackedChats) {
      chatidsElegiveis = trackedChats.map(c => c.chatid);
      console.log(`[ANALYZE] ${chatidsElegiveis.length} chats no lead_tracking com origem '${origemFilter}'`);
    }
  }

  // Busca mensagens a partir da data especificada ou padrão
  const dataInicio = fromDate ? new Date(`${fromDate}T00:00:00Z`) : new Date("2025-11-01T00:00:00Z");
  let query = supabaseAdmin
    .from("mensagens_clientes")
    .select("owner, chatid, eh_primeiro_contato_ads")
    .gte("recebido_em", dataInicio.toISOString())
    .not("chatid", "like", "%@g.us")
    .not("chatid", "is", null)
    .neq("chatid", "")
    .limit(10000);

  if (ownerId) {
    query = query.eq("owner", ownerId);
  }
  
  // Aplica filtro de origem usando eh_primeiro_contato_ads como fonte primária
  // Resolve o mismatch LID (Facebook) vs telefone real entre lead_tracking e mensagens_clientes
  if (origemFilter === "trafego_pago") {
    query = query.eq("eh_primeiro_contato_ads", true);
    console.log(`[ANALYZE] Filtro tráfego pago: eh_primeiro_contato_ads = true`);
  } else if (origemFilter === "organico") {
    query = query.or("eh_primeiro_contato_ads.eq.false,eh_primeiro_contato_ads.is.null");
    console.log(`[ANALYZE] Filtro orgânico: eh_primeiro_contato_ads != true`);
  }

  const { data: mensagens, error } = await query;

  if (error) {
    console.error("[ANALYZE] Erro ao buscar mensagens:", error);
    return [];
  }

  // Pega chats únicos
  const chatsUnicos = new Map<string, ChatAtivo>();
  (mensagens || []).forEach((m) => {
    if (!chatsUnicos.has(m.chatid)) {
      chatsUnicos.set(m.chatid, { owner: m.owner, chatid: m.chatid });
    }
  });

  // Verifica quais chats têm mensagens NOVAS após a última análise
  const chatids = Array.from(chatsUnicos.keys());
  
  if (chatids.length === 0) {
    return [];
  }
  
  // Busca última análise de cada chat (msg_fim_id = cursor da última mensagem processada)
  const { data: ultimasAnalises } = await supabaseAdmin
    .from("analises_conversas")
    .select("chatid, msg_fim_id")
    .in("chatid", chatids)
    .order("created_at", { ascending: false });

  // Mapa: chatid → último msg_fim_id analisado (pega só a mais recente por chat)
  const ultimoIdAnalisado = new Map<string, number>();
  (ultimasAnalises || []).forEach((a) => {
    if (!ultimoIdAnalisado.has(a.chatid)) {
      ultimoIdAnalisado.set(a.chatid, a.msg_fim_id || 0);
    }
  });

  // Filtra: inclui chats NUNCA analisados OU que têm mensagens NOVAS após última análise
  const chatsPendentes: ChatAtivo[] = [];
  
  for (const chat of chatsUnicos.values()) {
    const lastAnalyzedId = ultimoIdAnalisado.get(chat.chatid);
    
    if (lastAnalyzedId === undefined) {
      // Nunca analisado → incluir
      chatsPendentes.push(chat);
    } else {
      // Já analisado → verificar se tem mensagens novas após o cursor
      const { count } = await supabaseAdmin
        .from("mensagens_clientes")
        .select("id", { count: "exact", head: true })
        .eq("chatid", chat.chatid)
        .gt("id", lastAnalyzedId);
      
      if (count && count > 0) {
        chatsPendentes.push(chat);
      }
    }
  }

  return chatsPendentes.slice(0, limit);
}

/**
 * Busca o último ID de mensagem já processado para um chat
 */
export async function getLastReadId(chatId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("analises_conversas")
    .select("msg_fim_id")
    .eq("chatid", chatId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return 0;
  }

  return data.msg_fim_id || 0;
}

/**
 * Busca mensagens novas após o cursor
 */
export async function getNewMessages(
  chatId: string,
  afterId: number
): Promise<MensagemCliente[]> {
  const { data, error } = await supabaseAdmin
    .from("mensagens_clientes")
    .select("*")
    .eq("chatid", chatId)
    .gt("id", afterId)
    .order("id", { ascending: true });

  if (error) {
    console.error("[ANALYZE] Erro ao buscar mensagens:", error);
    return [];
  }

  return data as MensagemCliente[];
}

/**
 * Busca a data de entrada real do lead (primeira mensagem de todas)
 */
export async function getLeadEntryDate(chatId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("mensagens_clientes")
    .select("recebido_em, timestamp_ms, timestamp")
    .eq("chatid", chatId)
    .order("id", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  // Prioriza timestamp_ms/timestamp, fallback para recebido_em
  let dataEntrada: Date;
  if (data.timestamp_ms || data.timestamp) {
    let ts = Number(data.timestamp_ms || data.timestamp);
    if (ts < 10000000000) ts *= 1000; // Converte segundos para ms
    dataEntrada = new Date(ts);
  } else {
    dataEntrada = new Date(data.recebido_em);
  }

  return dataEntrada.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Busca a origem do lead no tracking (tráfego pago)
 * Retorna a origem se existir, ou null se não tiver tracking
 */
export async function getLeadOrigin(chatId: string, owner: string): Promise<string | null> {
  // 1. Tenta match direto no lead_tracking
  const { data, error } = await supabaseAdmin
    .from("lead_tracking")
    .select("origem")
    .eq("chatid", chatId)
    .eq("owner", owner)
    .limit(1)
    .single();

  if (!error && data) {
    return data.origem;
  }

  // 2. Fallback: verifica eh_primeiro_contato_ads em mensagens_clientes
  // Resolve mismatch quando lead_tracking tem LID e mensagens tem telefone real
  const { data: msgData } = await supabaseAdmin
    .from("mensagens_clientes")
    .select("eh_primeiro_contato_ads")
    .eq("chatid", chatId)
    .eq("owner", owner)
    .eq("eh_primeiro_contato_ads", true)
    .limit(1)
    .maybeSingle();

  if (msgData?.eh_primeiro_contato_ads) {
    return "facebook_ads"; // Default para ads quando detectado via flag
  }

  return null;
}

/**
 * Verifica se a origem é de tráfego pago
 */
export function isTrafegoPago(origem: string | null): boolean {
  if (!origem) return false;
  return ["facebook_ads", "instagram_ads", "google_ads"].includes(origem);
}

// ============================================
// FORMATAÇÃO
// ============================================

/**
 * Extrai timestamp de forma segura
 */
function getTimestamp(msg: MensagemCliente): number | null {
  let ts = Number(msg.timestamp_ms || msg.timestamp);
  if (isNaN(ts)) return null;
  // Se for muito pequeno (segundos em vez de ms), converte
  if (ts < 10000000000) ts *= 1000;
  return ts;
}

/**
 * Formata tempo em texto legível
 */
function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "0s";
  if (seconds < 60) return Math.floor(seconds) + "s";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ${Math.floor(seconds % 60)}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

/**
 * Formata transcrição e calcula métricas
 * Reproduz exatamente o node "Formatador" do N8N
 * @param messages - Mensagens do chat
 * @param config - Configuração da empresa (opcional, para cálculo de tempo justo)
 */
export function formatTranscription(
  messages: MensagemCliente[],
  config?: ConfigEmpresa
): TranscricaoFormatada | null {
  if (!messages || messages.length === 0) return null;

  let transcricao = "";
  const temposDeResposta: number[] = [];
  let lastCustomerMsgTime: number | null = null;
  let firstResponseTime: number | null = null;
  let firstResponseTimeJusto: number | null = null;
  let primeiraMsgForaExpediente = false;

  const primeiroId = messages[0].id;
  const ultimoId = messages[messages.length - 1].id;
  const chatid = messages[0].chatid;

  // Ordena por timestamp
  const sortedMsgs = [...messages].sort((a, b) => {
    const tsA = getTimestamp(a) || 0;
    const tsB = getTimestamp(b) || 0;
    return tsA - tsB;
  });

  for (const msg of sortedMsgs) {
    const isAtendente = msg.from_me;
    const timestamp = getTimestamp(msg);

    if (!timestamp) continue;

    // Texto para transcrição
    const ator = isAtendente ? "Atendente" : "Cliente";
    const texto = msg.mensagem || "[Mídia/Áudio]";
    const dataObj = new Date(timestamp);
    const hora = dataObj.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    transcricao += `[${hora}] ${ator}: ${texto}\n`;

    // Lógica de cálculo de tempo
    if (!isAtendente) {
      lastCustomerMsgTime = timestamp;
    } else {
      if (lastCustomerMsgTime !== null) {
        const diffSeconds = (timestamp - lastCustomerMsgTime) / 1000;

        // Aceita até 30 dias de delay
        if (diffSeconds >= 0 && diffSeconds < 2592000) {
          temposDeResposta.push(diffSeconds);

          if (firstResponseTime === null) {
            firstResponseTime = diffSeconds;
            
            // Calcula tempo justo se config disponível
            if (config) {
              const resultado = calcularTempoRespostaJusto(
                new Date(lastCustomerMsgTime),
                new Date(timestamp),
                config
              );
              firstResponseTimeJusto = resultado.tempoJustoMs / 1000;
              primeiraMsgForaExpediente = resultado.foraExpediente;
            }
          }
        }
        lastCustomerMsgTime = null;
      }
    }
  }

  // Calcula média
  const soma = temposDeResposta.reduce((a, b) => a + b, 0);
  const media = temposDeResposta.length > 0 ? soma / temposDeResposta.length : 0;

  // Extrai datas da primeira e última mensagem
  const primeiraMsg = sortedMsgs[0];
  const ultimaMsg = sortedMsgs[sortedMsgs.length - 1];
  
  const timestampEntrada = getTimestamp(primeiraMsg);
  const timestampUltima = getTimestamp(ultimaMsg);
  
  const dataEntradaLead = timestampEntrada 
    ? new Date(timestampEntrada).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Desconhecida";
    
  const dataUltimaMensagem = timestampUltima
    ? new Date(timestampUltima).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Desconhecida";

  return {
    chatid,
    primeiroId,
    ultimoId,
    transcricao,
    data_entrada_lead: dataEntradaLead,
    data_ultima_mensagem: dataUltimaMensagem,
    metrics: {
      tempo_primeira_resposta_texto: formatTime(firstResponseTime),
      tempo_medio_resposta_texto: formatTime(media),
      tempo_primeira_resposta_justo: config ? formatTime(firstResponseTimeJusto) : undefined,
      tempo_medio_resposta_justo: config ? formatTime(media) : undefined, // TODO: calcular média justa
      primeira_msg_fora_expediente: config ? primeiraMsgForaExpediente : undefined,
    },
  };
}

// ============================================
// ANÁLISE IA
// ============================================

/**
 * Analisa conversa usando Gemini
 */
export async function analyzeConversation(
  transcription: TranscricaoFormatada,
  config: ConfigEmpresa
): Promise<ResultadoIA | null> {
  // Instruções personalizadas da empresa (se houver)
  const instrucoesCustomizadas = config.instrucoes_ia 
    ? `\n# INSTRUÇÕES ESPECÍFICAS DA EMPRESA\n${config.instrucoes_ia}\n` 
    : "";

  const systemPrompt = `# ROLE
Você é um Auditor de Qualidade e Estrategista Comercial.
Contexto: Empresa **${config.nome_empresa || "Cliente"}** (Nicho: ${config.nicho || "Vendas"}).
Objetivo de Conversão: ${config.objetivo_conversao || "Vendas"}
${instrucoesCustomizadas}
# DADOS TÉCNICOS
- **Data de Entrada do Lead**: ${transcription.data_entrada_lead}
- **Data desta Análise / Última Mensagem**: ${transcription.data_ultima_mensagem}
- 1ª Resposta: ${transcription.metrics.tempo_primeira_resposta_texto}
- Cadência: ${transcription.metrics.tempo_medio_resposta_texto}

# TRANSCRIÇÃO
${transcription.transcricao}

# INSTRUÇÕES DE CLASSIFICAÇÃO (RIGOROSAS)

1. **TIPO DE CONVERSA:**
   - **"Vendas"**: Lead novo, interessado em comprar/agendar. Foco em aquisição.
   - **"Suporte"**: Cliente atual. Assuntos: Boleto, renovação, dúvida técnica, reclamação, remarcação.
   - **"Outros"**: Spam, engano.

2. **STATUS (DEPENDENTE DO TIPO):**
   *Se for VENDAS:*
   - **"Vendido"**: Pagamento confirmado ou contrato fechado.
   - **"Agendado"**: Aula experimental, visita ou reunião marcada (mas ainda não pagou).
   - **"Em Negociação"**: Dúvidas, objeções, interação ativa.
   - **"Perdido"**: Vácuo longo ou "Não" explícito.
   
   *Se for SUPORTE:*
   - **"Resolvido"**: Dúvida sanada, solicitação atendida.
   - **"Em Atendimento"**: Ainda pendente ou aguardando retorno.

3. **ORIGEM DO LEAD (Rastreamento) - ATENÇÃO ESPECIAL:**
   - **Meta (Facebook/Instagram Ads)**: Cliente menciona "anúncio", "propaganda", "vi no Instagram", "vi no Facebook", "apareceu pra mim", "vi na rede social", "vi no feed". QUALQUER menção a anúncio = **Meta**.
   - **Google (Google Ads)**: Cliente menciona "pesquisei no Google", "achei no Google", "vi no Google".
   - **Indicação**: Cliente menciona "indicação", "minha amiga falou", "fulano recomendou".
   - **Orgânico**: SOMENTE se não houver NENHUMA pista das anteriores.
   - **REGRA CRÍTICA**: Se houver QUALQUER menção a "anúncio", "propaganda", "vi" + rede social = origem é **Meta** ou **Google**, NUNCA Orgânico.

# ═══════════════════════════════════════════════════════════
# PILARES DE QUALIDADE (OBRIGATÓRIO PARA VENDAS)
# ═══════════════════════════════════════════════════════════

Avalie CADA pilar separadamente com nota 0-100:

**1. RAPPORT/CONEXÃO (Peso 20%):**
   - Usou nome do cliente?
   - Criou conexão pessoal (perguntou algo da vida, elogiou)?
   - Tom amigável e acolhedor vs robótico e automático?
   - Demonstrou empatia?

**2. PERSONALIZAÇÃO (Peso 30%):**
   - Entendeu a necessidade específica do cliente?
   - Ofereceu solução adequada ao perfil dele?
   - Fez perguntas de qualificação antes de ofertar?
   - Adaptou o discurso ao contexto do cliente?

**3. CONDUÇÃO DE FECHAMENTO (Peso 30%):**
   - Apresentou CTA (call-to-action) claro?
   - Usou técnicas de fechamento (assumir a venda, alternativas)?
   - Criou senso de urgência ou escassez?
   - Direcionou para o próximo passo concreto?

**4. TRATAMENTO DE OBJEÇÕES (Peso 20%):**
   - Respondeu objeções de forma eficaz?
   - Ofereceu alternativas (parcelamento, outro plano)?
   - Contornou a objeção ou aceitou passivamente?
   - Usou técnicas como espelhamento ou reformulação?

# ═══════════════════════════════════════════════════════════
# CATEGORIZAÇÃO DE OBJEÇÕES (CRÍTICO - SEJA ASSERTIVO)
# ═══════════════════════════════════════════════════════════

Ao detectar objeções, classifique CADA UMA em uma das categorias abaixo:

| Categoria | Descrição | Exemplos de falas do cliente |
|-----------|-----------|------------------------------|
| **preco** | Valor, custo, fora do orçamento | "Tá caro", "Não tenho como pagar", "Fora do orçamento", "Muito dinheiro", "Apertado" |
| **tempo** | Falta de tempo, horário incompatível | "Não tenho tempo", "Meu horário não bate", "Trabalho muito", "Chego tarde" |
| **localizacao** | Distância, endereço, deslocamento | "É longe", "Não tem perto de casa", "Complicado ir até aí" |
| **saude** | Problemas de saúde, lesões, restrições médicas | "Tenho problema no joelho", "Estou com lesão", "Médico não liberou", "Estou grávida", "Tenho hérnia" |
| **compromisso** | Medo de não continuar, histórico de desistência | "Tenho medo de não ir", "Sempre desisto", "Não sei se vou conseguir manter" |
| **consulta_terceiros** | Precisa consultar alguém antes de decidir | "Vou falar com meu marido/esposa", "Preciso ver com minha mãe", "Tenho que consultar" |
| **adiamento** | Deixar para depois, procrastinação | "Mês que vem", "Depois volto", "Preciso pensar", "Vou analisar", "Não é o momento" |
| **fidelidade** | Contrato, multa, compromisso longo | "Não quero contrato", "E se eu quiser sair?", "Tem multa?", "Período mínimo?" |
| **concorrencia** | Comparando com outras opções | "Tô vendo outras opções", "Outra academia é mais barata", "Vou pesquisar mais" |
| **interesse_baixo** | Curiosidade, sem intenção real | "Só queria saber o preço", "Foi só curiosidade", "Talvez um dia" |

**REGRA CRÍTICA**: Se a objeção não se encaixar CLARAMENTE em uma categoria acima, use a que mais se aproxima. Evite ao máximo não categorizar.

Para CADA pilar, forneça:
- **nota**: 0-100 (seja justo mas crítico)
- **feedback**: O que você observou de concreto (cite trechos se possível)
- **sugestao**: O que deveria ter feito diferente (seja específico e educativo)

# ═══════════════════════════════════════════════════════════
# ANÁLISE QUALITATIVA DETALHADA (VENDAS)
# ═══════════════════════════════════════════════════════════

Analise a QUALIDADE da comunicação, não apenas o resultado:

## Linguagem e Tom
- O atendente usou linguagem profissional? Informal demais? Formal demais?
- Houve erros de português que podem ter prejudicado credibilidade?
- O tom foi adequado ao perfil do cliente?
- Avalie: "Excelente" | "Boa" | "Regular" | "Ruim"

## Gatilhos Mentais
- Quais gatilhos foram APLICADOS? (escassez, prova_social, autoridade, urgencia, reciprocidade)
- Quais gatilhos FALTARAM e poderiam ter sido usados?

## Erros Críticos
Liste os erros graves cometidos:
- Aceitou objeção passivamente sem tentar contornar?
- Deixou cliente sem resposta por muito tempo?
- Perdeu oportunidade clara de fechamento?
- Falou mais do que ouviu?
- Deu preço direto sem gerar valor primeiro?
- Não criou urgência nenhuma?

## Diagnóstico Final
- POR QUE a venda não aconteceu (se não aconteceu)?
- Em qual momento específico a venda "morreu"?
- O que foi o fator decisivo para o resultado?

# ═══════════════════════════════════════════════════════════
# MENSAGEM SUGERIDA (NOVO - CRÍTICO)
# ═══════════════════════════════════════════════════════════

Crie uma MENSAGEM PRONTA para o vendedor copiar e enviar no WhatsApp.

**Regras:**
- Use o NOME do lead se disponível (ex: "Olá Maria!")
- Seja DIRETO e OBJETIVO (máximo 2-3 frases)
- Inclua CTA claro (próximo passo concreto)
- Tom amigável e profissional
- NÃO use emojis em excesso (máximo 1-2)

**Exemplos por situação:**
- Se "Em Negociação": "Olá [Nome]! Vi que você estava interessado(a) no [plano/serviço]. Posso te ajudar com alguma dúvida? 😊"
- Se "Perdido" por preço: "Oi [Nome]! Tenho uma condição especial que pode caber no seu orçamento. Posso te explicar?"
- Se vácuo longo: "Olá [Nome]! Tudo bem? Ainda está pensando em [objetivo]? Estou à disposição!"
- Se "Agendado": "Olá [Nome]! Só confirmando nosso [tipo] para [data]. Está tudo certo? 👍"

# ═══════════════════════════════════════════════════════════
# REGRAS ESPECIAIS
# ═══════════════════════════════════════════════════════════

5. **REGRA CRÍTICA DE FEEDBACK (VENDAS):**
   - **pontos_fortes**: SOMENTE preenche se funil_fase = "Vendido" ou "Agendado".
   - Se "Em Negociação" ou "Perdido": pontos_fortes = [] (array vazio). Foco total nos erros.
   - **pontos_melhoria**: SEMPRE liste os pontos fracos. Seja direto e crítico.

6. **REGRA PARA SUPORTE:**
   - Se tipo_conversacao = "Suporte": análise SIMPLIFICADA.
   - Suporte não é foco de vendas, então:
     - temperatura: "Frio"
     - pilares_atendimento: todos com nota 0 e feedback "N/A - Suporte"
     - analise_qualitativa: preencher apenas linguagem
     - nota_atendimento_0_100: 0 (não avaliar)
   - Apenas preencha resumo_executivo com descrição breve.

7. **EXTRAÇÃO DE DADOS DE CONVERSÃO:**
   - Se funil_fase = "Agendado": extraia DATA/HORA do agendamento.
   - Se funil_fase = "Vendido": extraia plano, valor, forma_pagamento, tempo_contrato.
   - Se NÃO mencionaram, deixe como null.

# OUTPUT JSON
Responda APENAS com JSON válido, sem formatação markdown:
{
  "tipo_conversacao": "Vendas" | "Suporte" | "Outros",
  "dados_cadastrais": {
    "nome_lead": "string/null",
    "nome_vendedor": "string/null",
    "origem_detectada": "Meta" | "Google" | "Indicação" | "Orgânico"
  },
  "temperatura": "Quente" | "Morno" | "Frio",
  "objecoes_detectadas": [
    {
      "categoria": "preco" | "tempo" | "localizacao" | "saude" | "compromisso" | "consulta_terceiros" | "adiamento" | "fidelidade" | "concorrencia" | "interesse_baixo",
      "evidencia": "Texto exato ou paráfrase da fala do cliente que demonstra a objeção"
    }
  ],
  "proximo_passo_sugerido": "string",
  "mensagem_sugerida": "Mensagem pronta para o vendedor copiar e enviar no WhatsApp",
  "resumo_executivo": "string",
  "funil_fase": "Status conforme regra acima",
  "conversao_realizada": boolean,
  "detalhes_conversao": "string/null",
  "pilares_atendimento": {
    "rapport_conexao": {
      "nota": 0-100,
      "feedback": "O que observou - seja específico",
      "sugestao": "O que deveria ter feito - seja educativo"
    },
    "personalizacao": {
      "nota": 0-100,
      "feedback": "...",
      "sugestao": "..."
    },
    "conducao_fechamento": {
      "nota": 0-100,
      "feedback": "...",
      "sugestao": "..."
    },
    "tratamento_objecoes": {
      "nota": 0-100,
      "feedback": "...",
      "sugestao": "..."
    },
    "nota_geral": "Média ponderada: (rapport*0.2 + person*0.3 + conducao*0.3 + objecoes*0.2)"
  },
  "analise_qualitativa": {
    "linguagem": {
      "avaliacao": "Excelente" | "Boa" | "Regular" | "Ruim",
      "observacoes": "Comentário sobre a linguagem usada"
    },
    "gatilhos_aplicados": ["escassez", "prova_social", etc.],
    "gatilhos_faltantes": ["urgencia", "autoridade", etc.],
    "erros_criticos": ["Erro 1", "Erro 2", etc.],
    "momento_perda": "Em qual momento a venda morreu (se perdido/negociação)",
    "diagnostico_final": "Resumo: por que aconteceu o resultado que aconteceu"
  },
  "dados_agendamento": {
    "data_agendada": "string/null",
    "tipo_agendamento": "string/null"
  },
  "dados_venda": {
    "plano": "string/null",
    "valor": number/null,
    "forma_pagamento": "string/null",
    "tempo_contrato": "string/null"
  },
  "performance_vendas": {
    "pontos_fortes": ["Só se Vendido/Agendado"],
    "pontos_melhoria": ["Sempre liste os erros"]
  },
  "nota_atendimento_0_100": "Igual a nota_geral dos pilares"
}`;

  // Usa retry com backoff para lidar com rate limits
  return retryWithBackoff(async () => {
    const { text } = await generateText({
      model: google("gemini-2.5-flash-preview-09-2025"),
      system: systemPrompt,
      prompt: `Analise esta conversa: ${transcription.transcricao}`,
    });

    // Limpa e parseia JSON
    const cleanJson = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const resultado = JSON.parse(cleanJson) as ResultadoIA;

    // Injeta métricas com datas
    resultado.metrics = {
      ...transcription.metrics,
      data_entrada_lead: transcription.data_entrada_lead,
      data_ultima_mensagem: transcription.data_ultima_mensagem,
    };

    return resultado;
  }, 3, 2000).catch((error) => {
    console.error("[ANALYZE] Erro na análise IA após 3 tentativas:", error);
    return null;
  });
}

// ============================================
// PERSISTÊNCIA
// ============================================

/**
 * Salva análise no banco de dados
 */
export async function saveAnalysis(
  chatid: string,
  owner: string,
  msgInicioId: number,
  msgFimId: number,
  resultadoIa: ResultadoIA
): Promise<boolean> {
  const { error } = await supabaseAdmin.from("analises_conversas").insert({
    chatid,
    owner,
    msg_inicio_id: msgInicioId,
    msg_fim_id: msgFimId,
    resultado_ia: resultadoIa,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[ANALYZE] Erro ao salvar análise:", error);
    return false;
  }

  return true;
}

// ============================================
// ORQUESTRADOR PRINCIPAL
// ============================================

/**
 * Processa um único chat
 */
export async function processChat(
  chat: ChatAtivo,
  config: ConfigEmpresa,
  dryRun = false
): Promise<{ status: "success" | "error" | "skipped"; message?: string }> {
  try {
    // 1. Busca último ID lido
    const lastId = await getLastReadId(chat.chatid);
    console.log(`[ANALYZE] Chat ${chat.chatid}: último ID = ${lastId}`);

    // 2. Busca mensagens novas
    const messages = await getNewMessages(chat.chatid, lastId);

    if (messages.length === 0) {
      return { status: "skipped", message: "Sem mensagens novas" };
    }

    console.log(`[ANALYZE] Chat ${chat.chatid}: ${messages.length} mensagens novas`);

    // 3. Formata transcrição (passa config para cálculo de tempo justo)
    const transcription = formatTranscription(messages, config);
    if (!transcription) {
      return { status: "skipped", message: "Falha ao formatar transcrição" };
    }

    // 4. Analisa com IA
    const resultado = await analyzeConversation(transcription, config);
    if (!resultado) {
      return { status: "error", message: "Falha na análise IA" };
    }

    // 4.1 Busca data REAL de entrada do lead (primeira mensagem de todas)
    const dataEntradaReal = await getLeadEntryDate(chat.chatid);
    if (dataEntradaReal && resultado.metrics) {
      resultado.metrics.data_entrada_lead = dataEntradaReal;
    }

    // 4.2 Se veio de tráfego pago, FORÇA tipo_conversacao = "Vendas"
    const origemLead = await getLeadOrigin(chat.chatid, chat.owner);
    if (isTrafegoPago(origemLead)) {
      if (resultado.tipo_conversacao !== "Vendas") {
        console.log(`[ANALYZE] ⚠️ Lead ${chat.chatid} veio de tráfego pago (${origemLead}), forçando tipo = "Vendas" (era: ${resultado.tipo_conversacao})`);
        resultado.tipo_conversacao = "Vendas";
      }
    }

    // 5. Salva no banco
    if (!dryRun) {
      const saved = await saveAnalysis(
        chat.chatid,
        chat.owner,
        transcription.primeiroId,
        transcription.ultimoId,
        resultado
      );

      if (!saved) {
        return { status: "error", message: "Falha ao salvar no banco" };
      }
    }

    console.log(`[ANALYZE] ✅ Chat ${chat.chatid} processado com sucesso`);
    return { status: "success" };
  } catch (error) {
    console.error(`[ANALYZE] ❌ Erro no chat ${chat.chatid}:`, error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Processa todos os chats pendentes
 * @param ownerId - ID do owner específico (opcional)
 * @param batchSize - Limite de chats por empresa (default: 10)
 * @param dryRun - Se true, não salva no banco
 * @param origemFilterOverride - Força filtro de origem (ignora config da empresa)
 */
export async function processAllPendingChats(
  ownerId?: string,
  batchSize = 10,
  dryRun = false,
  origemFilterOverride?: OrigemFilter
): Promise<{
  processed: number;
  errors: number;
  skipped: number;
  details: { chatid: string; status: string; message?: string }[];
}> {
  const details: { chatid: string; status: string; message?: string }[] = [];
  let processed = 0;
  let errors = 0;
  let skipped = 0;

  // Busca empresas
  const companies = ownerId
    ? [{ owner: ownerId, nome_empresa: "", nicho: "", objetivo_conversao: "", created_at: "" } as ConfigEmpresa]
    : await getActiveCompanies();

  if (ownerId) {
    // Busca config da empresa específica
    const { data } = await supabaseAdmin
      .from("config_empresas")
      .select("*")
      .eq("owner", ownerId)
      .single();

    if (data) {
      companies[0] = data as ConfigEmpresa;
    }
  }

  console.log(`[ANALYZE] Processando ${companies.length} empresa(s)`);

  for (const company of companies) {
    // Determina filtro de origem: override > config empresa > default (trafego_pago)
    const origemFilter: OrigemFilter = 
      origemFilterOverride || 
      company.analise_origem_filter || 
      "trafego_pago";
    
    console.log(`[ANALYZE] Empresa ${company.nome_empresa}: filtro de origem = '${origemFilter}'`);
    
    // Busca chats pendentes (com filtro de origem)
    const chats = await getActiveChatsWithoutAnalysisFallback(company.owner, batchSize, origemFilter);
    console.log(`[ANALYZE] Empresa ${company.nome_empresa}: ${chats.length} chats pendentes`);

    for (const chat of chats) {
      const result = await processChat(chat, company, dryRun);
      details.push({ chatid: chat.chatid, ...result });

      if (result.status === "success") processed++;
      else if (result.status === "error") errors++;
      else skipped++;

      // Rate limiting: espera 5 segundos entre cada análise (evita rate limit da API)
      await sleep(5000);
    }
  }

  return { processed, errors, skipped, details };
}
