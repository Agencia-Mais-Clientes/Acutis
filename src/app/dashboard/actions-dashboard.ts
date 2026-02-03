"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { 
  AnaliseConversa, 
  KPIsVendas, 
  KPIsSuporte, 
  KPIsDashboard,
  EtapaFunil,
  DadosFunil,
  InsightAgencia 
} from "@/lib/types";
import { getAnalises } from "./actions";
import { getCategoriaObjecao } from "@/lib/objecao-utils";

// ============================================
// HELPERS DE DATA
// ============================================

/** Parse data no formato "DD/MM/YYYY" ou "DD/MM/YYYY, HH:mm" */
function parseDataBR(dataStr: string | null | undefined): Date | null {
  if (!dataStr) return null;
  const match = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return new Date(
    parseInt(match[3]),
    parseInt(match[2]) - 1,
    parseInt(match[1])
  );
}

/** Verifica se uma data está dentro do período */
function dentroDoPeriodo(data: Date | null, inicio: Date, fim: Date): boolean {
  if (!data) return false;
  return data >= inicio && data <= fim;
}

/** Retorna período do mês atual */
function getMesAtual(): { inicio: Date; fim: Date } {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  return { inicio, fim };
}

// ============================================
// KPIs SEGMENTADOS
// ============================================

/** Busca KPIs segmentados por pilar (Vendas/Suporte) */
export async function getKPIsDashboard(
  ownerId: string,
  periodo?: { inicio: string; fim: string }
): Promise<KPIsDashboard> {
  const analises = await getAnalises(ownerId);

  // Período padrão: mês atual
  const periodoDefault = getMesAtual();
  const dataInicio = periodo?.inicio ? new Date(periodo.inicio) : periodoDefault.inicio;
  const dataFim = periodo?.fim ? new Date(periodo.fim) : periodoDefault.fim;

  // Separa por tipo de conversação
  const leadsVendas = analises.filter(
    (a) => a.resultado_ia?.tipo_conversacao === "Vendas"
  );
  const leadsSuporte = analises.filter(
    (a) => a.resultado_ia?.tipo_conversacao === "Suporte"
  );

  // ========== KPIs VENDAS ==========
  // Filtra leads novos no período usando data_entrada_lead
  const leadsNovosVendas = leadsVendas.filter((a) => {
    const dataEntrada = parseDataBR(a.resultado_ia?.metrics?.data_entrada_lead);
    return dentroDoPeriodo(dataEntrada, dataInicio, dataFim);
  });

  // Classifica por fase do funil
  const qualificados = leadsVendas.filter((a) => {
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    return fase.includes("negociação") || fase.includes("negociacao");
  });

  const agendadosVendas = leadsVendas.filter((a) => {
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    if (!fase.includes("agendado")) return false;
    const dataAgendada = parseDataBR(a.resultado_ia?.dados_agendamento?.data_agendada);
    return dentroDoPeriodo(dataAgendada, dataInicio, dataFim);
  });

  const convertidos = leadsVendas.filter((a) => {
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    return fase.includes("vendido") || fase.includes("matriculado") || fase.includes("convertido");
  });

  const perdidos = leadsVendas.filter((a) => {
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    return fase.includes("perdido") || fase.includes("vácuo") || fase.includes("vacuo");
  });

  // Nota média de vendas
  const notasVendas = leadsVendas
    .map((a) => a.resultado_ia?.nota_atendimento_0_100)
    .filter((n): n is number => typeof n === "number" && n > 0);
  const notaMediaVendas = notasVendas.length > 0
    ? Math.round(notasVendas.reduce((a, b) => a + b, 0) / notasVendas.length)
    : 0;

  const kpisVendas: KPIsVendas = {
    totalLeads: leadsVendas.length,
    leadsNovos: leadsNovosVendas.length,
    totalQualificado: qualificados.length,
    totalAgendado: agendadosVendas.length,
    totalConvertido: convertidos.length,
    totalPerdido: perdidos.length,
    taxaConversao: leadsVendas.length > 0
      ? Math.round((convertidos.length / leadsVendas.length) * 100)
      : 0,
    notaMedia: notaMediaVendas,
  };

  // ========== KPIs SUPORTE ==========
  const ticketsAbertos = leadsSuporte.filter((a) => {
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    return !fase.includes("resolvido");
  });

  const ticketsEmAndamento = leadsSuporte.filter((a) => {
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    return fase.includes("atendimento") || fase.includes("andamento");
  });

  const ticketsResolvidos = leadsSuporte.filter((a) => {
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    return fase.includes("resolvido");
  });

  // Nota média de suporte
  const notasSuporte = leadsSuporte
    .map((a) => a.resultado_ia?.nota_atendimento_0_100)
    .filter((n): n is number => typeof n === "number" && n > 0);
  const notaMediaSuporte = notasSuporte.length > 0
    ? Math.round(notasSuporte.reduce((a, b) => a + b, 0) / notasSuporte.length)
    : 0;

  const kpisSuporte: KPIsSuporte = {
    totalTickets: leadsSuporte.length,
    ticketsAbertos: ticketsAbertos.length,
    ticketsEmAndamento: ticketsEmAndamento.length,
    ticketsResolvidos: ticketsResolvidos.length,
    tempoMedioResposta: calcularTempoMedio(leadsSuporte),
    satisfacaoMedia: notaMediaSuporte,
  };

  return {
    vendas: kpisVendas,
    suporte: kpisSuporte,
    periodo: {
      inicio: dataInicio.toISOString(),
      fim: dataFim.toISOString(),
    },
  };
}

/** Calcula tempo médio de resposta */
function calcularTempoMedio(analises: AnaliseConversa[]): string {
  const tempos = analises
    .map((a) => a.resultado_ia?.metrics?.tempo_primeira_resposta_texto)
    .filter((t): t is string => !!t);
  
  if (tempos.length === 0) return "N/A";
  
  // Por enquanto retornamos o primeiro tempo como exemplo
  // Idealmente faríamos um cálculo real em minutos
  return tempos[0];
}

// ============================================
// FUNIL PERSONALIZADO
// ============================================

/** Busca etapas do funil configuradas para o owner */
export async function getEtapasFunil(
  ownerId: string,
  pilar: "vendas" | "suporte"
): Promise<EtapaFunil[]> {
  const { data, error } = await supabaseAdmin
    .from("etapas_funil")
    .select("*")
    .eq("owner", ownerId)
    .eq("pilar", pilar)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao buscar etapas do funil:", error);
    // Retorna etapas padrão se não encontrar
    return getEtapasPadrao(pilar);
  }

  if (!data || data.length === 0) {
    return getEtapasPadrao(pilar);
  }

  return data.map((e) => ({
    id: e.id,
    nome: e.nome,
    ordem: e.ordem,
    cor: e.cor,
    pilar: e.pilar as "vendas" | "suporte",
  }));
}

/** Etapas padrão caso não existam no banco */
function getEtapasPadrao(pilar: "vendas" | "suporte"): EtapaFunil[] {
  if (pilar === "vendas") {
    return [
      { id: "1", nome: "Lead Recebido", ordem: 1, cor: "#6366f1", pilar: "vendas" },
      { id: "2", nome: "Qualificado", ordem: 2, cor: "#8b5cf6", pilar: "vendas" },
      { id: "3", nome: "Agendado", ordem: 3, cor: "#3b82f6", pilar: "vendas" },
      { id: "4", nome: "Convertido", ordem: 4, cor: "#10b981", pilar: "vendas" },
      { id: "5", nome: "Perdido", ordem: 5, cor: "#ef4444", pilar: "vendas" },
    ];
  }
  return [
    { id: "1", nome: "Ticket Aberto", ordem: 1, cor: "#f59e0b", pilar: "suporte" },
    { id: "2", nome: "Em Atendimento", ordem: 2, cor: "#3b82f6", pilar: "suporte" },
    { id: "3", nome: "Resolvido", ordem: 3, cor: "#10b981", pilar: "suporte" },
  ];
}

/** Calcula dados do funil baseado nas análises */
export async function getDadosFunil(
  ownerId: string,
  pilar: "vendas" | "suporte",
  periodo?: { inicio: string; fim: string }
): Promise<DadosFunil[]> {
  const analises = await getAnalises(ownerId);
  const etapas = await getEtapasFunil(ownerId, pilar);

  // Período padrão: mês atual
  const periodoDefault = getMesAtual();
  const dataInicio = periodo?.inicio ? new Date(periodo.inicio) : periodoDefault.inicio;
  const dataFim = periodo?.fim ? new Date(periodo.fim) : periodoDefault.fim;

  // Filtra por tipo de conversação
  const analisesFiltradas = analises.filter((a) => {
    const tipoConversa = a.resultado_ia?.tipo_conversacao;
    if (pilar === "vendas") return tipoConversa === "Vendas";
    return tipoConversa === "Suporte";
  });

  const total = analisesFiltradas.length;

  if (pilar === "vendas") {
    // Conta cada etapa do funil de vendas
    const qualificados = analisesFiltradas.filter((a) => {
      const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
      return fase.includes("negociação") || fase.includes("negociacao");
    }).length;

    const agendados = analisesFiltradas.filter((a) => {
      const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
      return fase.includes("agendado");
    }).length;

    const convertidos = analisesFiltradas.filter((a) => {
      const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
      return fase.includes("vendido") || fase.includes("matriculado") || fase.includes("convertido");
    }).length;

    const perdidos = analisesFiltradas.filter((a) => {
      const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
      return fase.includes("perdido") || fase.includes("vácuo") || fase.includes("vacuo");
    }).length;

    // Mapeia para as etapas configuradas
    const contagemPorEtapa: Record<string, number> = {
      "Lead Recebido": total, // Todos os leads passam pela primeira etapa
      "Qualificado": qualificados,
      "Agendado": agendados,
      "Convertido": convertidos,
      "Perdido": perdidos,
    };

    return etapas.map((etapa) => ({
      etapa,
      quantidade: contagemPorEtapa[etapa.nome] ?? 0,
      percentual: total > 0 ? Math.round((contagemPorEtapa[etapa.nome] ?? 0) / total * 100) : 0,
    }));
  } else {
    // Funil de suporte
    const emAtendimento = analisesFiltradas.filter((a) => {
      const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
      return fase.includes("atendimento") || fase.includes("andamento");
    }).length;

    const resolvidos = analisesFiltradas.filter((a) => {
      const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
      return fase.includes("resolvido");
    }).length;

    const contagemPorEtapa: Record<string, number> = {
      "Ticket Aberto": total, // Todos os tickets passam pela primeira etapa
      "Em Atendimento": emAtendimento,
      "Resolvido": resolvidos,
    };

    return etapas.map((etapa) => ({
      etapa,
      quantidade: contagemPorEtapa[etapa.nome] ?? 0,
      percentual: total > 0 ? Math.round((contagemPorEtapa[etapa.nome] ?? 0) / total * 100) : 0,
    }));
  }
}

// ============================================
// INSIGHTS PARA AGÊNCIA (ADMIN ONLY)
// ============================================

/** Gera insights acionáveis para gestores de tráfego */
export async function getInsightsAgencia(ownerId: string): Promise<InsightAgencia[]> {
  const analises = await getAnalises(ownerId);
  const insights: InsightAgencia[] = [];

  const leadsVendas = analises.filter(
    (a) => a.resultado_ia?.tipo_conversacao === "Vendas"
  );

  if (leadsVendas.length === 0) return insights;

  // 1. INSIGHT: Top objeções → sugestão de copy
  const objecoes: Record<string, number> = {};
  leadsVendas.forEach((a) => {
    const obs = a.resultado_ia?.objecoes_detectadas || [];
    obs.forEach((o) => {
      if (o) {
        const cat = getCategoriaObjecao(o);
        objecoes[cat] = (objecoes[cat] || 0) + 1;
      }
    });
  });

  const topObjecao = Object.entries(objecoes).sort((a, b) => b[1] - a[1])[0];
  if (topObjecao) {
    const [categoria, qtd] = topObjecao;
    const percentual = Math.round((qtd / leadsVendas.length) * 100);
    const label = CATEGORIA_LABELS_INSIGHT[categoria] || categoria;
    
    insights.push({
      id: "objecao-1",
      tipo: "objecao",
      titulo: `Objeção #1: ${label}`,
      descricao: `${percentual}% dos leads mencionam "${label}" como barreira.`,
      sugestao: getSugestaoObjecao(categoria),
      impacto: percentual > 30 ? "alto" : percentual > 15 ? "medio" : "baixo",
      icone: "💬",
      dados: {
        valor: percentual,
        tendencia: "stable",
      },
    });
  }

  // 2. INSIGHT: Taxa de conversão por canal
  const canais: Record<string, { total: number; convertidos: number }> = {};
  leadsVendas.forEach((a) => {
    const origem = a.origem_tracking || a.resultado_ia?.dados_cadastrais?.origem_detectada || "Orgânico";
    if (!canais[origem]) {
      canais[origem] = { total: 0, convertidos: 0 };
    }
    canais[origem].total++;
    
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    if (fase.includes("vendido") || fase.includes("matriculado")) {
      canais[origem].convertidos++;
    }
  });

  const melhorCanal = Object.entries(canais)
    .map(([canal, dados]) => ({
      canal,
      taxa: dados.total > 0 ? Math.round((dados.convertidos / dados.total) * 100) : 0,
      total: dados.total,
    }))
    .sort((a, b) => b.taxa - a.taxa)[0];

  if (melhorCanal && melhorCanal.total > 2) {
    insights.push({
      id: "canal-1",
      tipo: "canal",
      titulo: `Melhor canal: ${melhorCanal.canal}`,
      descricao: `${melhorCanal.taxa}% taxa de conversão com ${melhorCanal.total} leads.`,
      sugestao: `Aumente investimento em ${melhorCanal.canal} para maximizar ROI.`,
      impacto: melhorCanal.taxa > 20 ? "alto" : "medio",
      icone: "🎯",
      dados: {
        valor: melhorCanal.taxa,
        tendencia: "up",
      },
    });
  }

  // 3. INSIGHT: Leads perdidos
  const perdidos = leadsVendas.filter((a) => {
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    return fase.includes("perdido") || fase.includes("vácuo");
  });

  if (perdidos.length > 0) {
    const taxaPerdidos = Math.round((perdidos.length / leadsVendas.length) * 100);
    
    insights.push({
      id: "conversao-1",
      tipo: "conversao",
      titulo: "Taxa de Perda",
      descricao: `${taxaPerdidos}% dos leads estão sendo perdidos.`,
      sugestao: "Revisar scripts de objeção e tempo de resposta para reduzir perdas.",
      impacto: taxaPerdidos > 40 ? "alto" : taxaPerdidos > 20 ? "medio" : "baixo",
      icone: "📉",
      dados: {
        valor: taxaPerdidos,
        tendencia: "down",
      },
    });
  }

  // 4. INSIGHT: Agendamentos
  const agendados = leadsVendas.filter((a) => {
    const fase = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    return fase.includes("agendado");
  });

  if (agendados.length > 0) {
    const taxaAgendamento = Math.round((agendados.length / leadsVendas.length) * 100);
    
    insights.push({
      id: "conversao-2",
      tipo: "conversao",
      titulo: "Taxa de Agendamento",
      descricao: `${taxaAgendamento}% dos leads agendam visita/aula.`,
      sugestao: taxaAgendamento < 30 
        ? "Criar mais urgência e oferecer benefício para agendar agora."
        : "Manter abordagem atual, está funcionando bem!",
      impacto: taxaAgendamento > 30 ? "baixo" : "medio",
      icone: "📅",
      dados: {
        valor: taxaAgendamento,
        tendencia: taxaAgendamento > 25 ? "up" : "stable",
      },
    });
  }

  return insights;
}

// Função de categorização importada de @/lib/objecao-utils
// Labels para exibição nos insights
const CATEGORIA_LABELS_INSIGHT: Record<string, string> = {
  preco: "Preço",
  tempo: "Horário",
  localizacao: "Localização",
  saude: "Saúde",
  compromisso: "Medo de Compromisso",
  consulta_terceiros: "Consulta Terceiros",
  adiamento: "Adiamento",
  fidelidade: "Contrato",
  concorrencia: "Concorrência",
  interesse_baixo: "Interesse Baixo",
};

function getSugestaoObjecao(categoria: string): string {
  const sugestoes: Record<string, string> = {
    preco: "Destaque o valor agregado nos anúncios. Inclua parcelas e promoções no copy.",
    tempo: "Mencione flexibilidade de horários e opções de aulas nos anúncios.",
    localizacao: "Use segmentação por raio no Meta Ads. Destaque facilidade de acesso.",
    saude: "Mostre que há acompanhamento profissional e adaptações para todos os níveis.",
    compromisso: "Ofereça aulas experimentais sem compromisso e ambiente acolhedor.",
    consulta_terceiros: "Crie promoções para casais/famílias e flexibilize agendamentos.",
    adiamento: "Crie urgência com promoções por tempo limitado e benefícios para decisão rápida.",
    fidelidade: "Ofereça período de teste sem compromisso e destaque flexibilidade.",
    concorrencia: "Destaque diferenciais competitivos únicos e depoimentos de clientes.",
    interesse_baixo: "Qualifique melhor os leads antes de investir em nutrição.",
  };
  return sugestoes[categoria] || "Analise as conversas para identificar padrões específicos.";
}
