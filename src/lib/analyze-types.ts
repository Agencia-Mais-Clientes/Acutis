// Tipos para o serviço de análise de conversas

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
  metrics: {
    tempo_primeira_resposta_texto: string;
    tempo_medio_resposta_texto: string;
  };
}

// Config empresa (extendido)
export interface ConfigEmpresa {
  owner: string;
  nome_empresa: string;
  nicho: string;
  objetivo_conversao: string;
  created_at: string;
  ativo?: boolean;
  instrucoes_ia?: string; // Instruções personalizadas para a IA (opcional)
}

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
  ownerId?: string;  // Se não informado, processa todas empresas ativas
  batchSize?: number; // Limite de chats por execução (default: 10)
  dryRun?: boolean;   // Se true, não salva no banco
}
