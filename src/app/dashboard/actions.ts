"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { AnaliseConversa, KPIs, Gargalo, ObjecaoRanking, CategoriaObjecao, ObjecaoDetectada } from "@/lib/types";

// Busca todas as análises do owner com origem real do tracking
export async function getAnalises(ownerId: string): Promise<AnaliseConversa[]> {
  // Busca análises
  const { data: analises, error: analisesError } = await supabaseAdmin
    .from("analises_conversas")
    .select("*")
    .eq("owner", ownerId)
    .order("created_at", { ascending: false });

  if (analisesError) {
    console.error("Erro ao buscar análises:", analisesError);
    return [];
  }

  if (!analises || analises.length === 0) {
    return [];
  }

  // Busca origens do tracking para os chatids das análises
  const chatids = analises.map(a => a.chatid);
  const { data: trackings, error: trackingError } = await supabaseAdmin
    .from("lead_tracking")
    .select("chatid, origem")
    .eq("owner", ownerId)
    .in("chatid", chatids);

  if (trackingError) {
    // Se a tabela não existir ou der erro, retorna sem origem_tracking
    console.log("Aviso: Não foi possível buscar lead_tracking:", trackingError.message);
  }

  // Cria mapa de chatid -> origem
  const origemMap = new Map<string, string>();
  if (trackings) {
    trackings.forEach(t => {
      origemMap.set(t.chatid, t.origem);
    });
  }

  // Junta as análises com a origem do tracking
  return analises.map(a => ({
    ...a,
    origem_tracking: origemMap.get(a.chatid) || null,
  })) as AnaliseConversa[];
}

// Calcula KPIs do dashboard
export async function getKPIs(ownerId: string, diasPeriodo: number = 7): Promise<KPIs> {
  const analises = await getAnalises(ownerId);

  const leadsVendas = analises.filter(
    (a) => a.resultado_ia?.tipo_conversacao === "Vendas"
  );
  const leadsSuporte = analises.filter(
    (a) => a.resultado_ia?.tipo_conversacao === "Suporte"
  );

  // Data limite para o período
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasPeriodo);

  // Calcula leads novos baseado na data REAL de entrada (metrics.data_entrada_lead)
  const leadsNovos = leadsVendas.filter((a) => {
    const dataEntradaStr = a.resultado_ia?.metrics?.data_entrada_lead;
    if (!dataEntradaStr) return false;
    
    // Parse da data no formato "DD/MM/YYYY, HH:mm"
    const match = dataEntradaStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return false;
    
    const dataEntrada = new Date(
      parseInt(match[3]),      // ano
      parseInt(match[2]) - 1,  // mês (0-indexed)
      parseInt(match[1])       // dia
    );
    
    return dataEntrada >= dataLimite;
  });

  const vendidos = leadsVendas.filter((a) => {
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    return fase.includes("vendido") || fase.includes("matriculado");
  });

  // Agendamentos no período (se tiver data_agendada, usa ela; senão usa created_at)
  const agendados = leadsVendas.filter((a) => {
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    if (!fase.includes("agendado")) return false;
    
    // Tenta usar data real do agendamento se disponível
    const dataAgendadaStr = a.resultado_ia?.dados_agendamento?.data_agendada;
    if (dataAgendadaStr) {
      const match = dataAgendadaStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (match) {
        const dataAgendada = new Date(
          parseInt(match[3]),
          parseInt(match[2]) - 1,
          parseInt(match[1])
        );
        return dataAgendada >= dataLimite;
      }
    }
    
    // Fallback: usa data da análise
    const dataAnalise = new Date(a.created_at);
    return dataAnalise >= dataLimite;
  });

  const totalLeads = leadsVendas.length;
  const totalSucesso = vendidos.length + agendados.length;
  const taxaSucesso = totalLeads > 0 ? Math.round((totalSucesso / totalLeads) * 100) : 0;

  // Calcula nota média
  const notasValidas = analises
    .map((a) => a.resultado_ia?.nota_atendimento_0_100)
    .filter((n): n is number => typeof n === "number" && n > 0);
  const notaMedia =
    notasValidas.length > 0
      ? Math.round(notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length)
      : 0;

  return {
    totalLeads,
    leadsNovos: leadsNovos.length,
    totalSuporte: leadsSuporte.length,
    totalVendido: vendidos.length,
    totalAgendado: agendados.length,
    taxaSucesso,
    notaMedia,
    periodo: diasPeriodo,
  };
}

// Identifica gargalos
export async function getGargalos(ownerId: string): Promise<Gargalo[]> {
  const analises = await getAnalises(ownerId);

  const leadsVendas = analises.filter(
    (a) => a.resultado_ia?.tipo_conversacao === "Vendas"
  );

  const emNegociacao = leadsVendas.filter((a) => {
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    return fase.includes("negociação") || fase.includes("negociacao");
  });

  const perdidos = leadsVendas.filter((a) => {
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    return fase.includes("perdido") || fase.includes("vácuo") || fase.includes("vacuo");
  });

  const gargalos: Gargalo[] = [];

  if (emNegociacao.length > 0) {
    gargalos.push({
      tipo: "negociacao",
      descricao: "Travados em Negociação",
      quantidade: emNegociacao.length,
      cor: "yellow",
    });
  }

  if (perdidos.length > 0) {
    gargalos.push({
      tipo: "perdido",
      descricao: "Perdidos / Sem Resposta",
      quantidade: perdidos.length,
      cor: "red",
    });
  }

  return gargalos;
}

// Mapeamento de categorias para nomes amigáveis
const CATEGORIA_LABELS: Record<CategoriaObjecao, string> = {
  preco: "Preço",
  tempo: "Tempo/Horário",
  localizacao: "Localização",
  saude: "Saúde",
  compromisso: "Medo de Compromisso",
  consulta_terceiros: "Consultar Terceiros",
  adiamento: "Adiamento",
  fidelidade: "Contrato/Fidelidade",
  concorrencia: "Concorrência",
  interesse_baixo: "Interesse Baixo",
};

// Ícone por categoria de objeção
const CATEGORIA_ICONES: Record<CategoriaObjecao, string> = {
  preco: "💰",
  tempo: "⏰",
  localizacao: "📍",
  saude: "🏥",
  compromisso: "😰",
  consulta_terceiros: "👨‍👩‍👧",
  adiamento: "📅",
  fidelidade: "📝",
  concorrencia: "🏆",
  interesse_baixo: "😐",
};

// Categoriza objeções do formato legado (string) para o novo formato
function categorizeLegacyObjecao(texto: string): CategoriaObjecao {
  const t = texto.toLowerCase();
  
  if (t.includes("preço") || t.includes("caro") || t.includes("valor") || t.includes("taxa") || t.includes("custo") || t.includes("orçamento") || t.includes("dinheiro")) {
    return "preco";
  }
  if (t.includes("horário") || t.includes("agenda") || t.includes("tempo") || t.includes("tarde") || t.includes("cedo") || t.includes("trabalho")) {
    return "tempo";
  }
  if (t.includes("local") || t.includes("longe") || t.includes("distância") || t.includes("perto") || t.includes("endereço")) {
    return "localizacao";
  }
  if (t.includes("saúde") || t.includes("saude") || t.includes("lesão") || t.includes("lesao") || t.includes("médico") || t.includes("medico") || t.includes("joelho") || t.includes("coluna") || t.includes("grávida") || t.includes("gravida") || t.includes("cirurgia") || t.includes("problema")) {
    return "saude";
  }
  if (t.includes("medo") || t.includes("desisto") || t.includes("desistir") || t.includes("conseguir") || t.includes("disciplina")) {
    return "compromisso";
  }
  if (t.includes("marido") || t.includes("esposa") || t.includes("mãe") || t.includes("mae") || t.includes("pai") || t.includes("família") || t.includes("familia") || t.includes("consultar")) {
    return "consulta_terceiros";
  }
  if (t.includes("pensar") || t.includes("analisar") || t.includes("depois") || t.includes("mês que vem") || t.includes("semana que vem") || t.includes("momento") || t.includes("agora não")) {
    return "adiamento";
  }
  if (t.includes("fidelidade") || t.includes("contrato") || t.includes("multa") || t.includes("período") || t.includes("cancelar")) {
    return "fidelidade";
  }
  if (t.includes("outra") || t.includes("concorrente") || t.includes("pesquisar") || t.includes("opção") || t.includes("opcao") || t.includes("comparar")) {
    return "concorrencia";
  }
  if (t.includes("curiosidade") || t.includes("só saber") || t.includes("talvez") || t.includes("não sei se")) {
    return "interesse_baixo";
  }
  
  // Fallback mais inteligente baseado em padrões comuns
  if (t.includes("não") && (t.includes("posso") || t.includes("consigo") || t.includes("dá"))) {
    return "adiamento";
  }
  
  return "adiamento"; // Default para adiamento ao invés de "outros"
}

// Ranking de objeções
export async function getTopObjecoes(ownerId: string): Promise<ObjecaoRanking[]> {
  const analises = await getAnalises(ownerId);

  const leadsVendas = analises.filter(
    (a) => a.resultado_ia?.tipo_conversacao === "Vendas"
  );

  const contagem: Record<CategoriaObjecao, number> = {
    preco: 0,
    tempo: 0,
    localizacao: 0,
    saude: 0,
    compromisso: 0,
    consulta_terceiros: 0,
    adiamento: 0,
    fidelidade: 0,
    concorrencia: 0,
    interesse_baixo: 0,
  };

  leadsVendas.forEach((a) => {
    const objecoes = a.resultado_ia?.objecoes_detectadas || [];
    
    objecoes.forEach((obj) => {
      if (!obj) return;
      
      // Verifica se é o novo formato (objeto) ou legado (string)
      if (typeof obj === "object" && "categoria" in obj) {
        // Novo formato: { categoria: "preco", evidencia: "..." }
        const objecao = obj as ObjecaoDetectada;
        if (objecao.categoria && contagem[objecao.categoria] !== undefined) {
          contagem[objecao.categoria]++;
        }
      } else if (typeof obj === "string" && obj.trim()) {
        // Formato legado: string
        const categoria = categorizeLegacyObjecao(obj);
        contagem[categoria]++;
      }
    });
  });

  const total = Object.values(contagem).reduce((a, b) => a + b, 0);

  // Filtra apenas categorias com ocorrências e ordena
  const ranking: ObjecaoRanking[] = (Object.entries(contagem) as [CategoriaObjecao, number][])
    .filter(([, quantidade]) => quantidade > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([categoria, quantidade]) => ({
      nome: CATEGORIA_LABELS[categoria],
      quantidade,
      percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0,
      icone: CATEGORIA_ICONES[categoria],
    }));

  return ranking;
}
