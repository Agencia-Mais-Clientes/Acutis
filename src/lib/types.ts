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
