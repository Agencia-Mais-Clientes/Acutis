/**
 * Utilitários para manipulação de datas no formato brasileiro (DD/MM/YYYY)
 */

/**
 * Parse data no formato "DD/MM/YYYY" ou "DD/MM/YYYY, HH:mm"
 * @returns Date object ou null se inválido
 */
export function parseDataBR(dataStr: string | null | undefined): Date | null {
  if (!dataStr) return null;
  const match = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return new Date(
    parseInt(match[3]),     // ano
    parseInt(match[2]) - 1, // mês (0-indexed)
    parseInt(match[1])      // dia
  );
}

/**
 * Verifica se uma data está dentro do período (inclusivo)
 */
export function dentroDoPeriodo(data: Date | null, inicio: Date, fim: Date): boolean {
  if (!data) return false;
  return data >= inicio && data <= fim;
}

/**
 * Retorna período do mês atual (do dia 1 até agora)
 */
export function getMesAtual(): { inicio: Date; fim: Date } {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  return { inicio, fim };
}

/**
 * Parseia um período de strings ISO para objetos Date
 * Usa mês atual como fallback
 */
export function parsePeriodo(periodo?: { inicio: string; fim: string }): { inicio: Date; fim: Date } {
  const periodoDefault = getMesAtual();
  return {
    inicio: periodo?.inicio ? new Date(periodo.inicio) : periodoDefault.inicio,
    fim: periodo?.fim ? new Date(periodo.fim) : periodoDefault.fim,
  };
}

/**
 * Formata uma data para exibição no padrão brasileiro
 */
export function formatDataBR(data: Date): string {
  return data.toLocaleDateString("pt-BR");
}

/**
 * Formata uma data com hora para exibição
 */
export function formatDataHoraBR(data: Date): string {
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
