/**
 * Constantes de negócio centralizadas
 * Evita strings mágicas espalhadas pelo código
 */

// ============================================
// FASES DO FUNIL DE VENDAS
// ============================================

export const FUNIL_FASE = {
  // Positivas
  VENDIDO: ["vendido", "matriculado", "convertido"],
  AGENDADO: ["agendado"],
  NEGOCIACAO: ["negociação", "negociacao", "em negociação"],
  // Negativas
  PERDIDO: ["perdido", "vácuo", "vacuo", "sem resposta"],
  // Suporte
  RESOLVIDO: ["resolvido"],
  EM_ATENDIMENTO: ["atendimento", "andamento", "em atendimento"],
} as const;

/**
 * Verifica se uma fase contém um dos termos de uma categoria
 */
export function matchFase(fase: string | undefined | null, categoria: keyof typeof FUNIL_FASE): boolean {
  if (!fase) return false;
  const faseLower = fase.toLowerCase();
  return FUNIL_FASE[categoria].some(termo => faseLower.includes(termo));
}

// ============================================
// TIPOS DE CONVERSAÇÃO
// ============================================

export const TIPO_CONVERSACAO = {
  VENDAS: "Vendas",
  SUPORTE: "Suporte",
} as const;

export type TipoConversacao = typeof TIPO_CONVERSACAO[keyof typeof TIPO_CONVERSACAO];

// ============================================
// CATEGORIAS DE OBJEÇÃO
// ============================================

export const CATEGORIA_OBJECAO = {
  PRECO: "preco",
  TEMPO: "tempo",
  LOCALIZACAO: "localizacao",
  SAUDE: "saude",
  COMPROMISSO: "compromisso",
  CONSULTA_TERCEIROS: "consulta_terceiros",
  ADIAMENTO: "adiamento",
  FIDELIDADE: "fidelidade",
  CONCORRENCIA: "concorrencia",
  INTERESSE_BAIXO: "interesse_baixo",
  OUTROS: "outros",
} as const;

export type CategoriaObjecaoKey = typeof CATEGORIA_OBJECAO[keyof typeof CATEGORIA_OBJECAO];

// Labels para exibição
export const CATEGORIA_OBJECAO_LABELS: Record<CategoriaObjecaoKey, string> = {
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

// Ícones por categoria
export const CATEGORIA_OBJECAO_ICONES: Record<CategoriaObjecaoKey, string> = {
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

// ============================================
// ORIGENS DE TRÁFEGO
// ============================================

export const ORIGEM_TRAFEGO = {
  FACEBOOK_ADS: "facebook_ads",
  INSTAGRAM_ADS: "instagram_ads",
  GOOGLE_ADS: "google_ads",
  ORGANICO: "organico",
} as const;

export type OrigemTrafegoKey = typeof ORIGEM_TRAFEGO[keyof typeof ORIGEM_TRAFEGO];

// Labels para exibição
export const ORIGEM_TRAFEGO_LABELS: Record<OrigemTrafegoKey, string> = {
  facebook_ads: "Facebook Ads",
  instagram_ads: "Instagram Ads",
  google_ads: "Google Ads",
  organico: "Orgânico",
};

// ============================================
// CONFIGURAÇÕES PADRÃO
// ============================================

export const DEFAULTS = {
  BATCH_SIZE: 10,
  MAX_DURATION_SECONDS: 60,
  TIMEZONE: "America/Sao_Paulo",
} as const;
