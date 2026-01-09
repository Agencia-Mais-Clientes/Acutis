"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { AnaliseConversa, KPIs, Gargalo, ObjecaoRanking } from "@/lib/types";

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

// Ranking de objeções
export async function getTopObjecoes(ownerId: string): Promise<ObjecaoRanking[]> {
  const analises = await getAnalises(ownerId);

  const leadsVendas = analises.filter(
    (a) => a.resultado_ia?.tipo_conversacao === "Vendas"
  );

  const contagem: Record<string, number> = {};

  leadsVendas.forEach((a) => {
    const objecoes = a.resultado_ia?.objecoes_detectadas || [];
    objecoes.forEach((obj) => {
      if (obj && obj.trim()) {
        const categoria = categorizeObjecao(obj);
        contagem[categoria] = (contagem[categoria] || 0) + 1;
      }
    });
  });

  const total = Object.values(contagem).reduce((a, b) => a + b, 0);

  const ranking: ObjecaoRanking[] = Object.entries(contagem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, quantidade]) => ({
      nome,
      quantidade,
      percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0,
      icone: getObjecaoIcone(nome),
    }));

  return ranking;
}

// Categoriza objeções
function categorizeObjecao(texto: string): string {
  const t = texto.toLowerCase();
  if (t.includes("preço") || t.includes("caro") || t.includes("valor") || t.includes("taxa")) {
    return "Preço";
  }
  if (t.includes("horário") || t.includes("agenda") || t.includes("tempo")) {
    return "Horário";
  }
  if (t.includes("local") || t.includes("longe") || t.includes("distância")) {
    return "Localização";
  }
  if (t.includes("fidelidade") || t.includes("contrato") || t.includes("multa")) {
    return "Contrato";
  }
  if (texto.length < 30) return texto;
  return "Outros";
}

// Ícone por categoria de objeção
function getObjecaoIcone(categoria: string): string {
  const icones: Record<string, string> = {
    Preço: "💰",
    Horário: "⏰",
    Localização: "📍",
    Contrato: "📝",
    Outros: "🤔",
  };
  return icones[categoria] || "🤔";
}
