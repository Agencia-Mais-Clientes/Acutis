// Tipos para resultado_ia JSONB
export interface DadosCadastrais {
  nome_lead: string | null;
  nome_vendedor: string | null;
  origem_detectada: "Meta" | "Google" | "Indicação" | "Orgânico";
}

export interface PerformanceVendas {
  pontos_fortes: string[];
  pontos_melhoria: string[];
}

// ============================================
// PILARES DE QUALIDADE (NOVO)
// ============================================

/** Pilar individual de avaliação de atendimento */
export interface PilarAtendimento {
  nota: number;        // 0-100
  feedback: string;    // O que foi observado
  sugestao: string;    // O que fazer diferente
}

/** 4 Pilares de qualidade do atendimento */
export interface PilaresAtendimento {
  rapport_conexao: PilarAtendimento;
  personalizacao: PilarAtendimento;
  conducao_fechamento: PilarAtendimento;
  tratamento_objecoes: PilarAtendimento;
  nota_geral: number;  // Média ponderada dos 4 pilares
}

// ============================================
// ANÁLISE QUALITATIVA (NOVO)
// ============================================

/** Avaliação da qualidade da linguagem */
export interface AvaliacaoLinguagem {
  avaliacao: "Excelente" | "Boa" | "Regular" | "Ruim";
  observacoes: string;
}

/** Análise qualitativa detalhada da conversa */
export interface AnaliseQualitativa {
  linguagem: AvaliacaoLinguagem;
  gatilhos_aplicados: string[];    // ["escassez", "prova_social", "autoridade"]
  gatilhos_faltantes: string[];    // ["urgência", "reciprocidade"]
  erros_criticos: string[];        // Lista de erros graves cometidos
  momento_perda?: string;          // "Quando cliente perguntou preço e não teve resposta rápida"
  diagnostico_final: string;       // Resumo do que causou sucesso ou fracasso
}

export interface Metrics {
  tempo_primeira_resposta_texto: string;
  tempo_medio_resposta_texto: string;
  data_entrada_lead?: string;    // Data de entrada do lead
  data_ultima_mensagem?: string; // Data da última mensagem analisada
}

export interface ResultadoIA {
  tipo_conversacao: "Vendas" | "Suporte" | "Outros";
  temperatura: "Quente" | "Morno" | "Frio";
  funil_fase: "Vendido" | "Agendado" | "Em Negociação" | "Perdido" | "Resolvido" | "Em Atendimento";
  nota_atendimento_0_100: number;
  resumo_executivo: string;
  proximo_passo_sugerido: string;
  conversao_realizada: boolean;
  detalhes_conversao: string | null;
  objecoes_detectadas: string[];
  dados_cadastrais: DadosCadastrais;
  performance_vendas: PerformanceVendas;
  metrics: Metrics;
  
  // Pilares de Qualidade (NOVO - opcional para retrocompatibilidade)
  pilares_atendimento?: PilaresAtendimento;
  
  // Análise Qualitativa (NOVO - opcional para retrocompatibilidade)
  analise_qualitativa?: AnaliseQualitativa;
  
  // Dados de conversão extraídos
  dados_agendamento?: {
    data_agendada: string | null;
    tipo_agendamento: string | null;
  };
  dados_venda?: {
    plano: string | null;
    valor: number | null;
    forma_pagamento: string | null;
    tempo_contrato: string | null;
  };
}

// Tipo para a tabela analises_conversas
export interface AnaliseConversa {
  id: string;
  chatid: string;
  owner: string;
  created_at: string;
  resultado_ia: ResultadoIA;
  // Origem real do tracking (vem de lead_tracking, não da inferência IA)
  origem_tracking?: "facebook_ads" | "instagram_ads" | "google_ads" | "organico" | null;
}

// Tipo para config_empresas
export interface ConfigEmpresa {
  owner: string;
  nome_empresa: string;
  nicho: string;
  objetivo_conversao: string;
  ativo?: boolean;
  created_at: string;
}

// Tipos para KPIs calculados
export interface KPIs {
  totalLeads: number;
  leadsNovos: number;        // Leads novos no período (baseado na data de entrada real)
  totalSuporte: number;
  totalVendido: number;
  totalAgendado: number;
  taxaSucesso: number;
  notaMedia: number;
  periodo: number;           // Período em dias usado para cálculo
}

// Tipo para gargalos
export interface Gargalo {
  tipo: "negociacao" | "perdido" | "sem_resposta";
  descricao: string;
  quantidade: number;
  cor: string;
}

// Tipo para ranking de objeções
export interface ObjecaoRanking {
  nome: string;
  quantidade: number;
  percentual: number;
  icone: string;
}

// ============================================
// DASHBOARD SEGMENTADO (VENDAS / SUPORTE)
// ============================================

/** Filtro de período para o dashboard */
export interface FiltroData {
  dataInicio: Date;
  dataFim: Date;
}

/** KPIs específicos de Vendas */
export interface KPIsVendas {
  totalLeads: number;
  leadsNovos: number;
  totalQualificado: number;
  totalAgendado: number;
  totalConvertido: number;
  totalPerdido: number;
  taxaConversao: number;
  notaMedia: number;
}

/** KPIs específicos de Suporte */
export interface KPIsSuporte {
  totalTickets: number;
  ticketsAbertos: number;
  ticketsEmAndamento: number;
  ticketsResolvidos: number;
  tempoMedioResposta: string;
  satisfacaoMedia: number;
}

/** KPIs combinados do dashboard */
export interface KPIsDashboard {
  vendas: KPIsVendas;
  suporte: KPIsSuporte;
  periodo: {
    inicio: string;
    fim: string;
  };
}

// ============================================
// FUNIL PERSONALIZADO
// ============================================

/** Etapa individual do funil */
export interface EtapaFunil {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
  pilar: "vendas" | "suporte";
}

/** Dados do funil com contagem por etapa */
export interface DadosFunil {
  etapa: EtapaFunil;
  quantidade: number;
  percentual: number;
}

// ============================================
// INSIGHTS PARA AGÊNCIA (ADMIN ONLY)
// ============================================

/** Insight acionável para gestores de tráfego */
export interface InsightAgencia {
  id: string;
  tipo: "objecao" | "horario" | "canal" | "keywords" | "conversao";
  titulo: string;
  descricao: string;
  sugestao: string;
  impacto: "alto" | "medio" | "baixo";
  icone: string;
  dados?: {
    valor: number;
    comparativo?: number;
    tendencia?: "up" | "down" | "stable";
  };
}
