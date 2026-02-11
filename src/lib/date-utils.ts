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
 * Extrai a data de entrada de uma análise com fallback para created_at.
 * Prioridade: data_entrada_lead (BR format) → created_at (ISO format)
 */
export function getDataEntradaAnalise(
  dataEntradaLead: string | null | undefined,
  createdAt: string | null | undefined
): Date | null {
  const parsed = parseDataBR(dataEntradaLead);
  if (parsed) return parsed;

  if (createdAt) {
    const fallback = new Date(createdAt);
    if (!isNaN(fallback.getTime())) return fallback;
  }

  return null;
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

// ============================================
// Enterprise Date Range Picker Utilities
// ============================================

export type DateRange = {
  from: Date;
  to: Date;
};

export type ComparisonType = "previous" | "previousYear" | "custom";

export type Granularity = "day" | "week" | "month";

export type PresetKey =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "lastQuarter"
  | "thisYear"
  | "lastYear";

export interface Preset {
  key: PresetKey;
  label: string;
  getValue: () => DateRange;
}

/**
 * Returns all available date presets
 */
export function getPresets(): Preset[] {
  const today = new Date();

  return [
    {
      key: "today",
      label: "Hoje",
      getValue: () => {
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        return { from: start, to: end };
      },
    },
    {
      key: "yesterday",
      label: "Ontem",
      getValue: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        return { from: start, to: end };
      },
    },
    {
      key: "last7days",
      label: "Últimos 7 dias",
      getValue: () => {
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { from: start, to: end };
      },
    },
    {
      key: "last30days",
      label: "Últimos 30 dias",
      getValue: () => {
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        const start = new Date(today);
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        return { from: start, to: end };
      },
    },
    {
      key: "thisMonth",
      label: "Este mês",
      getValue: () => {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        return { from: start, to: end };
      },
    },
    {
      key: "lastMonth",
      label: "Mês passado",
      getValue: () => {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        return { from: start, to: end };
      },
    },
    {
      key: "thisQuarter",
      label: "Este trimestre",
      getValue: () => {
        const quarter = Math.floor(today.getMonth() / 3);
        const start = new Date(today.getFullYear(), quarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        return { from: start, to: end };
      },
    },
    {
      key: "lastQuarter",
      label: "Trimestre passado",
      getValue: () => {
        const quarter = Math.floor(today.getMonth() / 3);
        const prevQuarter = quarter === 0 ? 3 : quarter - 1;
        const year = quarter === 0 ? today.getFullYear() - 1 : today.getFullYear();
        const start = new Date(year, prevQuarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(year, prevQuarter * 3 + 3, 0);
        end.setHours(23, 59, 59, 999);
        return { from: start, to: end };
      },
    },
    {
      key: "thisYear",
      label: "Este ano",
      getValue: () => {
        const start = new Date(today.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        return { from: start, to: end };
      },
    },
    {
      key: "lastYear",
      label: "Ano passado",
      getValue: () => {
        const start = new Date(today.getFullYear() - 1, 0, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(today.getFullYear() - 1, 11, 31);
        end.setHours(23, 59, 59, 999);
        return { from: start, to: end };
      },
    },
  ];
}

/**
 * Calculate comparison period based on the main range and comparison type
 */
export function getComparisonPeriod(
  range: DateRange,
  type: ComparisonType
): DateRange {
  const daysDiff = Math.ceil(
    (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
  );

  switch (type) {
    case "previous": {
      const end = new Date(range.from);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - daysDiff + 1);
      start.setHours(0, 0, 0, 0);
      return { from: start, to: end };
    }
    case "previousYear": {
      const start = new Date(range.from);
      start.setFullYear(start.getFullYear() - 1);
      const end = new Date(range.to);
      end.setFullYear(end.getFullYear() - 1);
      return { from: start, to: end };
    }
    case "custom":
    default:
      return range;
  }
}

/**
 * Format date range for display
 * Example: "01 jan - 31 jan 2026"
 */
export function formatDateRangeDisplay(range: DateRange): string {
  const fromStr = range.from.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  const toStr = range.to.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  const year = range.to.getFullYear();

  // Same day
  if (range.from.toDateString() === range.to.toDateString()) {
    return `${fromStr} ${year}`;
  }

  return `${fromStr} - ${toStr} ${year}`;
}

/**
 * Calculate percentage difference between two values
 */
export function calculateDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Get number of days between two dates
 */
export function getDaysDiff(range: DateRange): number {
  return Math.ceil(
    (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
}

/**
 * Convert DateRange to serializable format for URL/API
 */
export function serializeDateRange(range: DateRange): { from: string; to: string } {
  return {
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  };
}

/**
 * Parse serialized date range from URL/API
 */
export function deserializeDateRange(data: { from: string; to: string }): DateRange {
  return {
    from: new Date(data.from),
    to: new Date(data.to),
  };
}

