// Tipos para o serviço de análise de conversas

// ============================================
// Tipos para Tracking de Origem
// ============================================

// Tipos de origem de tráfego
export type OrigemTrafego = "facebook_ads" | "instagram_ads" | "google_ads" | "organico";

// Filtros de origem para análise
export type OrigemFilter = "trafego_pago" | "organico" | "todos";

// Estrutura da tabela lead_tracking
export interface LeadTracking {
  id: number;
  chatid: string;
  owner: string;
  origem: OrigemTrafego;
  campanha_id: string | null;
  source_app: string | null;
  ctwa_clid: string | null;
  ad_body: string | null;
  ad_title: string | null;
  primeira_mensagem: string | null;
  detected_at: string;
}

// ============================================
// Tipos para Mensagens
// ============================================

// Estrutura da tabela mensagens_clientes
export interface MensagemCliente {
  id: number;
  chatid: string;
  owner: string;
  mensagem: string | null;
  from_me: boolean;
  timestamp?: number;
  timestamp_ms?: number;
  recebido_em: string;
}

// Chat ativo para análise
export interface ChatAtivo {
  owner: string;
  chatid: string;
}

// Transcrição formatada
export interface TranscricaoFormatada {
  chatid: string;
  primeiroId: number;
  ultimoId: number;
  transcricao: string;
  data_entrada_lead: string;  // Data/hora da primeira mensagem do lead
  data_ultima_mensagem: string; // Data/hora da última mensagem
  metrics: {
    tempo_primeira_resposta_texto: string;   // Tempo bruto (cronológico)
    tempo_medio_resposta_texto: string;       // Média bruta
    // Métricas de tempo justo (considerando horário comercial)
    tempo_primeira_resposta_justo?: string;   // Tempo descontando fora do expediente
    tempo_medio_resposta_justo?: string;      // Média descontando fora do expediente
    primeira_msg_fora_expediente?: boolean;   // Se a primeira msg do cliente foi fora do horário
  };
}

// ============================================
// Tipos para Horário de Funcionamento
// ============================================

// Configuração de horário por dia
export interface HorarioDia {
  inicio: string | null;  // "08:00" formato HH:mm
  fim: string | null;     // "18:00" formato HH:mm
  ativo: boolean;         // Se a empresa abre nesse dia
}

// Dias da semana em português (keys do JSONB)
export type DiaSemana = "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";

// Configuração completa da semana
export type HorarioFuncionamento = Record<DiaSemana, HorarioDia>;

// Default para empresas que ainda não configuraram
export const HORARIO_FUNCIONAMENTO_DEFAULT: HorarioFuncionamento = {
  segunda: { inicio: "08:00", fim: "18:00", ativo: true },
  terca: { inicio: "08:00", fim: "18:00", ativo: true },
  quarta: { inicio: "08:00", fim: "18:00", ativo: true },
  quinta: { inicio: "08:00", fim: "18:00", ativo: true },
  sexta: { inicio: "08:00", fim: "18:00", ativo: true },
  sabado: { inicio: "08:00", fim: "12:00", ativo: true },
  domingo: { inicio: null, fim: null, ativo: false },
};

// ============================================
// Tipos para Configuração de Empresa
// ============================================

// Config empresa (extendido)
export interface ConfigEmpresa {
  owner: string;
  nome_empresa: string;
  nicho: string;
  objetivo_conversao: string;
  created_at: string;
  ativo?: boolean;
  instrucoes_ia?: string;              // Instruções personalizadas para a IA
  analise_origem_filter?: OrigemFilter; // Filtro de origem para análise (default: trafego_pago)
  horario_funcionamento?: HorarioFuncionamento; // Horário de funcionamento por dia
  timezone?: string;                   // Timezone da empresa (default: America/Sao_Paulo)
}

// ============================================
// Tipos para API de Análise
// ============================================

// Response do endpoint
export interface AnalyzeResponse {
  success: boolean;
  processed: number;
  errors: number;
  details: {
    chatid: string;
    status: "success" | "error" | "skipped";
    message?: string;
  }[];
}

// Request do endpoint
export interface AnalyzeRequest {
  ownerId?: string;          // Se não informado, processa todas empresas ativas
  batchSize?: number;        // Limite de chats por execução (default: 10)
  dryRun?: boolean;          // Se true, não salva no banco
  origemFilter?: OrigemFilter; // Filtro de origem (default: usa config da empresa)
}
