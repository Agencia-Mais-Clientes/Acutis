"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { AnaliseConversa, KPIs, Gargalo, ObjecaoRanking, CategoriaObjecao, ObjecaoDetectada } from "@/lib/types";
import { categorizarObjecaoLegado, getCategoriaObjecao } from "@/lib/objecao-utils";
import { dentroDoPeriodo, parsePeriodo, getDataEntradaAnalise } from "@/lib/date-utils";
import { requireAuth } from "@/lib/auth-utils";
import { matchFase, TIPO_CONVERSACAO} from "@/lib/constants";

// ============================================
// HELPERS INTERNOS
// ============================================

/** Filtra análises por data de entrada dentro do período (fallback: created_at) */
function filtrarPorPeriodo(
  analises: AnaliseConversa[],
  periodo?: { inicio: string; fim: string }
): AnaliseConversa[] {
  const { inicio: dataInicio, fim: dataFim } = parsePeriodo(periodo);

  return analises.filter((a) => {
    const dataEntrada = getDataEntradaAnalise(
      a.resultado_ia?.metrics?.data_entrada_lead,
      a.created_at
    );
    return dentroDoPeriodo(dataEntrada, dataInicio, dataFim);
  });
}

// Busca todas as análises do owner com origem real do tracking
// SEGURANÇA: Valida sessão antes de buscar dados
export async function getAnalises(ownerId: string): Promise<AnaliseConversa[]> {
  // Valida que o usuário tem permissão para acessar este ownerId
  const authorizedOwnerId = await requireAuth(ownerId);
  
  // Busca análises
  const { data: analises, error: analisesError } = await supabaseAdmin
    .from("analises_conversas")
    .select("*")
    .eq("owner", authorizedOwnerId)
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

  const vendidos = leadsVendas.filter((a) => matchFase(a.resultado_ia?.funil_fase, "VENDIDO"));

  const agendados = leadsVendas.filter((a) => {
    if (!matchFase(a.resultado_ia?.funil_fase, "AGENDADO")) return false;
    
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

// Identifica gargalos (filtrado por período)
export async function getGargalos(
  ownerId: string,
  periodo?: { inicio: string; fim: string }
): Promise<Gargalo[]> {
  const todasAnalises = await getAnalises(ownerId);
  const analises = filtrarPorPeriodo(todasAnalises, periodo);

  const leadsVendas = analises.filter(
    (a) => a.resultado_ia?.tipo_conversacao === "Vendas"
  );

  const emNegociacao = leadsVendas.filter((a) => matchFase(a.resultado_ia?.funil_fase, "NEGOCIACAO"));

  const perdidos = leadsVendas.filter((a) => matchFase(a.resultado_ia?.funil_fase, "PERDIDO"));

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
  outros: "Outros",
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
  outros: "❓",
};

// Função de categorização importada de @/lib/objecao-utils

// Ranking de objeções (filtrado por período)
export async function getTopObjecoes(
  ownerId: string,
  periodo?: { inicio: string; fim: string }
): Promise<ObjecaoRanking[]> {
  try {
    const todasAnalises = await getAnalises(ownerId);
    const analises = filtrarPorPeriodo(todasAnalises, periodo);

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
      outros: 0,
    };

    leadsVendas.forEach((a) => {
      const objecoes = a.resultado_ia?.objecoes_detectadas || [];
      
      objecoes.forEach((obj) => {
        if (!obj) return;
        
        // Usa função unificada para categorizar
        const categoria = getCategoriaObjecao(obj);
        
        // Incrementa contagem de forma segura
        if (contagem[categoria] !== undefined) {
          contagem[categoria]++;
        } else {
          contagem.outros = (contagem.outros || 0) + 1;
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
        nome: CATEGORIA_LABELS[categoria] || categoria,
        categoria,  // Chave da categoria para filtragem
        quantidade,
        percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0,
        icone: CATEGORIA_ICONES[categoria] || "❓",
      }));

    return ranking;
  } catch (error) {
    console.error("Erro ao buscar top objeções:", error);
    return [];
  }
}
