// Utilitários para cálculo de tempo de resposta com horário comercial
// Este módulo permite calcular tempo de resposta "justo", descontando períodos fora do expediente

import type { 
  HorarioFuncionamento, 
  DiaSemana,
  ConfigEmpresa 
} from "./analyze-types";
import { HORARIO_FUNCIONAMENTO_DEFAULT } from "./analyze-types";

// ============================================
// CONSTANTES
// ============================================

const TIMEZONE_DEFAULT = "America/Sao_Paulo";

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Converte Date para timezone específico e retorna o dia da semana em português
 */
export function getDiaSemana(date: Date, timezone: string = TIMEZONE_DEFAULT): DiaSemana {
  // Formata a data no timezone para pegar o dia correto
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: timezone,
  });
  const dayName = formatter.format(date);
  
  const dayMap: Record<string, DiaSemana> = {
    "Sun": "domingo",
    "Mon": "segunda",
    "Tue": "terca",
    "Wed": "quarta",
    "Thu": "quinta",
    "Fri": "sexta",
    "Sat": "sabado",
  };
  
  return dayMap[dayName] || "segunda";
}

/**
 * Extrai hora e minuto de uma Date no timezone especificado
 */
export function getHoraLocal(date: Date, timezone: string = TIMEZONE_DEFAULT): { hora: number; minuto: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  });
  
  const parts = formatter.formatToParts(date);
  const hora = parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);
  const minuto = parseInt(parts.find(p => p.type === "minute")?.value || "0", 10);
  
  return { hora, minuto };
}

/**
 * Converte string "HH:mm" para minutos desde meia-noite
 */
function horaStringParaMinutos(horaStr: string | null): number | null {
  if (!horaStr) return null;
  const [h, m] = horaStr.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Verifica se um horário está dentro do expediente
 */
export function estaNoExpediente(
  date: Date,
  horarioFuncionamento: HorarioFuncionamento = HORARIO_FUNCIONAMENTO_DEFAULT,
  timezone: string = TIMEZONE_DEFAULT
): boolean {
  const dia = getDiaSemana(date, timezone);
  const config = horarioFuncionamento[dia];
  
  // Se o dia não está ativo, não está no expediente
  if (!config.ativo) return false;
  
  // Se não tem horário definido, considera fechado
  if (!config.inicio || !config.fim) return false;
  
  const { hora, minuto } = getHoraLocal(date, timezone);
  const minutosAtuais = hora * 60 + minuto;
  
  const inicioMin = horaStringParaMinutos(config.inicio);
  const fimMin = horaStringParaMinutos(config.fim);
  
  if (inicioMin === null || fimMin === null) return false;
  
  return minutosAtuais >= inicioMin && minutosAtuais <= fimMin;
}

/**
 * Encontra a próxima abertura do expediente a partir de uma data
 * Retorna a data/hora da próxima abertura
 */
export function getProximaAbertura(
  date: Date,
  horarioFuncionamento: HorarioFuncionamento = HORARIO_FUNCIONAMENTO_DEFAULT,
  timezone: string = TIMEZONE_DEFAULT
): Date {
  // Começa do próximo minuto para evitar loops
  const cursor = new Date(date.getTime());
  
  // Limite de 7 dias para evitar loop infinito se todos os dias estiverem fechados
  const maxDias = 7;
  
  for (let diasPercorridos = 0; diasPercorridos < maxDias; diasPercorridos++) {
    const dia = getDiaSemana(cursor, timezone);
    const config = horarioFuncionamento[dia];
    
    if (config.ativo && config.inicio) {
      const { hora, minuto } = getHoraLocal(cursor, timezone);
      const minutosAtuais = hora * 60 + minuto;
      const inicioMin = horaStringParaMinutos(config.inicio);
      
      if (inicioMin !== null) {
        // Se ainda não chegou na abertura de hoje
        if (minutosAtuais < inicioMin) {
          // Calcula quanto falta para a abertura em ms
          const diffMinutos = inicioMin - minutosAtuais;
          return new Date(cursor.getTime() + diffMinutos * 60 * 1000);
        }
        
        // Se já passou do horário de abertura mas ainda está no expediente
        const fimMin = horaStringParaMinutos(config.fim);
        if (fimMin !== null && minutosAtuais <= fimMin) {
          // Já está no expediente, retorna a data atual
          return date;
        }
      }
    }
    
    // Avança para o próximo dia às 00:00 (no timezone local)
    // Adiciona 24h e depois busca a meia-noite
    cursor.setTime(cursor.getTime() + 24 * 60 * 60 * 1000);
    // Reseta para meia-noite aproximada (pode ter pequeno erro de timezone)
    const { hora } = getHoraLocal(cursor, timezone);
    cursor.setTime(cursor.getTime() - hora * 60 * 60 * 1000);
  }
  
  // Fallback: se todos os dias estiverem fechados, retorna a data original
  console.warn("[BUSINESS-HOURS] Todos os dias parecem estar fechados. Usando data original.");
  return date;
}

/**
 * Resultado do cálculo de tempo de resposta
 */
export interface TempoRespostaResult {
  tempoRealMs: number;      // Tempo cronológico em milissegundos
  tempoJustoMs: number;     // Tempo considerando apenas horário comercial
  foraExpediente: boolean;  // Se a mensagem do cliente foi fora do expediente
  tempoRealTexto: string;   // Tempo formatado (ex: "2h 30m")
  tempoJustoTexto: string;  // Tempo justo formatado
}

/**
 * Formata milissegundos em texto legível
 */
function formatarTempo(ms: number): string {
  if (ms < 0) return "0s";
  
  const segundos = Math.floor(ms / 1000);
  if (segundos < 60) return `${segundos}s`;
  
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `${minutos}m ${segundos % 60}s`;
  
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas}h ${minutos % 60}m`;
  
  const dias = Math.floor(horas / 24);
  return `${dias}d ${horas % 24}h`;
}

/**
 * Calcula tempo de resposta "justo", descontando horas fora do expediente
 * 
 * Se o cliente mandou mensagem fora do expediente:
 * - O tempo justo começa a contar a partir da próxima abertura
 * 
 * @param mensagemCliente - Timestamp da mensagem do cliente
 * @param respostaAtendente - Timestamp da resposta do atendente
 * @param config - Configuração da empresa (horários + timezone)
 */
export function calcularTempoRespostaJusto(
  mensagemCliente: Date,
  respostaAtendente: Date,
  config: ConfigEmpresa
): TempoRespostaResult {
  const horario = config.horario_funcionamento || HORARIO_FUNCIONAMENTO_DEFAULT;
  const timezone = config.timezone || TIMEZONE_DEFAULT;
  
  // Tempo real (cronológico)
  const tempoRealMs = respostaAtendente.getTime() - mensagemCliente.getTime();
  
  // Verificar se mensagem do cliente foi fora do expediente
  const clienteNoExpediente = estaNoExpediente(mensagemCliente, horario, timezone);
  
  let tempoJustoMs: number;
  
  if (clienteNoExpediente) {
    // Cliente mandou dentro do expediente - tempo justo = tempo real
    tempoJustoMs = tempoRealMs;
  } else {
    // Cliente mandou fora do expediente - tempo começa da próxima abertura
    const proximaAbertura = getProximaAbertura(mensagemCliente, horario, timezone);
    tempoJustoMs = respostaAtendente.getTime() - proximaAbertura.getTime();
    
    // Se o atendente respondeu antes da abertura, tempo justo = 0
    if (tempoJustoMs < 0) {
      tempoJustoMs = 0;
    }
  }
  
  return {
    tempoRealMs,
    tempoJustoMs,
    foraExpediente: !clienteNoExpediente,
    tempoRealTexto: formatarTempo(tempoRealMs),
    tempoJustoTexto: formatarTempo(tempoJustoMs),
  };
}

/**
 * Wrapper simplificado para usar no formatTranscription
 * Recebe timestamps em ms e retorna tempo formatado
 */
export function calcularTempoJusto(
  timestampClienteMs: number,
  timestampAtendenteMs: number,
  config: ConfigEmpresa
): { tempoTexto: string; foraExpediente: boolean } {
  const result = calcularTempoRespostaJusto(
    new Date(timestampClienteMs),
    new Date(timestampAtendenteMs),
    config
  );
  
  return {
    tempoTexto: result.tempoJustoTexto,
    foraExpediente: result.foraExpediente,
  };
}
