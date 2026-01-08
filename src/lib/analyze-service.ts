// Serviço de análise de conversas

import { supabaseAdmin } from "@/lib/supabase";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type {
  MensagemCliente,
  ChatAtivo,
  TranscricaoFormatada,
  ConfigEmpresa,
} from "@/lib/analyze-types";
import type { ResultadoIA } from "@/lib/types";

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
  maxRetries = 3,
  baseDelayMs = 2000
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
 * Busca chats ativos sem análise nas últimas 24h
 * Reproduz exatamente a query do N8N
 */
export async function getActiveChatsWithoutAnalysis(
  ownerId?: string,
  limit = 50
): Promise<ChatAtivo[]> {
  // Query raw para reproduzir exatamente o SQL do N8N
  const query = `
    SELECT DISTINCT m.owner, m.chatid
    FROM public.mensagens_clientes m
    INNER JOIN public.config_empresas c ON m.owner = c.owner
    LEFT JOIN public.analises_conversas a ON (
        m.chatid = a.chatid 
        AND a.created_at > (NOW() - INTERVAL '24 hours') 
    )
    WHERE 
        m.recebido_em >= (NOW() - INTERVAL '30 days') 
        AND a.id IS NULL
        AND m.chatid NOT LIKE '%@g.us'
        AND m.chatid IS NOT NULL
        AND m.chatid != ''
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
 */
async function getActiveChatsWithoutAnalysisFallback(
  ownerId?: string,
  limit = 50
): Promise<ChatAtivo[]> {
  // Busca mensagens dos últimos 30 dias
  let query = supabaseAdmin
    .from("mensagens_clientes")
    .select("owner, chatid")
    .gte("recebido_em", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .not("chatid", "like", "%@g.us")
    .not("chatid", "is", null)
    .neq("chatid", "");

  if (ownerId) {
    query = query.eq("owner", ownerId);
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

  // Filtra quem já tem análise nas últimas 24h
  const chatids = Array.from(chatsUnicos.keys());
  const { data: analisesRecentes } = await supabaseAdmin
    .from("analises_conversas")
    .select("chatid")
    .in("chatid", chatids)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const chatidsComAnalise = new Set((analisesRecentes || []).map((a) => a.chatid));

  // Retorna apenas quem NÃO tem análise recente
  const resultado = Array.from(chatsUnicos.values()).filter(
    (c) => !chatidsComAnalise.has(c.chatid)
  );

  return resultado.slice(0, limit);
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
 */
export function formatTranscription(
  messages: MensagemCliente[]
): TranscricaoFormatada | null {
  if (!messages || messages.length === 0) return null;

  let transcricao = "";
  const temposDeResposta: number[] = [];
  let lastCustomerMsgTime: number | null = null;
  let firstResponseTime: number | null = null;

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
          }
        }
        lastCustomerMsgTime = null;
      }
    }
  }

  // Calcula média
  const soma = temposDeResposta.reduce((a, b) => a + b, 0);
  const media = temposDeResposta.length > 0 ? soma / temposDeResposta.length : 0;

  return {
    chatid,
    primeiroId,
    ultimoId,
    transcricao,
    metrics: {
      tempo_primeira_resposta_texto: formatTime(firstResponseTime),
      tempo_medio_resposta_texto: formatTime(media),
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

3. **ORIGEM DO LEAD (Rastreamento):**
   - Procure pistas: "Vi no Insta/Face" (Meta), "Vi no Google" (Google), "Indicação" (Indicação). Se não achar, "Orgânico".

4. **ANÁLISE QUALITATIVA:**
   - **Objeções:** Liste barreiras reais (Preço, Horário, Local, Decisor). Se for Suporte, liste o Problema.
   - **Ação Sugerida:** O que o atendente deve fazer a seguir?

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
  "objecoes_detectadas": ["string"],
  "proximo_passo_sugerido": "string",
  "resumo_executivo": "string",
  "funil_fase": "Status conforme regra acima",
  "conversao_realizada": boolean,
  "detalhes_conversao": "string/null",
  "performance_vendas": {
    "pontos_fortes": ["string"],
    "pontos_melhoria": ["string"]
  },
  "nota_atendimento_0_100": 0
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

    // Injeta métricas
    resultado.metrics = transcription.metrics;

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

    // 3. Formata transcrição
    const transcription = formatTranscription(messages);
    if (!transcription) {
      return { status: "skipped", message: "Falha ao formatar transcrição" };
    }

    // 4. Analisa com IA
    const resultado = await analyzeConversation(transcription, config);
    if (!resultado) {
      return { status: "error", message: "Falha na análise IA" };
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
 */
export async function processAllPendingChats(
  ownerId?: string,
  batchSize = 10,
  dryRun = false
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
    ? [{ owner: ownerId, nome_empresa: "", nicho: "", objetivo_conversao: "", created_at: "" }]
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
    // Busca chats pendentes
    const chats = await getActiveChatsWithoutAnalysis(company.owner, batchSize);
    console.log(`[ANALYZE] Empresa ${company.nome_empresa}: ${chats.length} chats pendentes`);

    for (const chat of chats) {
      const result = await processChat(chat, company, dryRun);
      details.push({ chatid: chat.chatid, ...result });

      if (result.status === "success") processed++;
      else if (result.status === "error") errors++;
      else skipped++;

      // Rate limiting: espera 2 segundos entre cada análise (evita rate limit da API)
      await sleep(2000);
    }
  }

  return { processed, errors, skipped, details };
}
