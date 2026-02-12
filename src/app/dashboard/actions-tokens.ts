"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-utils";
import { isAdminSession } from "@/lib/auth";
import type { TokenUsage } from "@/lib/types";

export interface TokenStats {
  totalAnalises: number;
  totalTokens: number;
  totalInput: number;
  totalOutput: number;
  mediaTokensPorAnalise: number;
  mediaInput: number;
  mediaOutput: number;
  analisesComToken: number;
  analisesSemToken: number;
  porEmpresa: EmpresaTokenStats[];
  historicoDiario: DailyTokenStats[];
}

export interface EmpresaTokenStats {
  owner: string;
  empresa: string;
  totalAnalises: number;
  totalTokens: number;
  mediaTokens: number;
}

export interface DailyTokenStats {
  data: string;
  totalAnalises: number;
  totalTokens: number;
  totalInput: number;
  totalOutput: number;
}

/**
 * Busca estatísticas de consumo de tokens da IA
 * Admin: vê todas as empresas
 * Cliente: vê apenas a própria empresa
 */
export async function getTokenStats(
  ownerId: string,
  periodo?: { inicio: string; fim: string }
): Promise<TokenStats> {
  const authorizedOwnerId = await requireAuth(ownerId);
  const isAdmin = await isAdminSession();

  // Monta query base
  let query = supabaseAdmin
    .from("analises_conversas")
    .select("owner, created_at, resultado_ia")
    .order("created_at", { ascending: false });

  // Se não é admin, filtra pelo owner
  if (!isAdmin) {
    query = query.eq("owner", authorizedOwnerId);
  }

  // Filtra por período
  if (periodo?.inicio) {
    query = query.gte("created_at", new Date(periodo.inicio).toISOString());
  }
  if (periodo?.fim) {
    query = query.lte("created_at", new Date(periodo.fim).toISOString());
  }

  const { data: analises, error } = await query;

  if (error) {
    console.error("[TOKENS] Erro ao buscar análises:", error);
    return emptyStats();
  }

  if (!analises || analises.length === 0) {
    return emptyStats();
  }

  // Processa estatísticas
  let totalTokens = 0;
  let totalInput = 0;
  let totalOutput = 0;
  let analisesComToken = 0;

  // Agrupamento por empresa
  const porEmpresaMap = new Map<string, { totalAnalises: number; totalTokens: number }>();

  // Agrupamento por dia
  const porDiaMap = new Map<string, DailyTokenStats>();

  for (const analise of analises) {
    const tokenUsage = analise.resultado_ia?.metrics?.token_usage as TokenUsage | undefined;
    const owner = analise.owner;

    // Agrupamento por empresa
    if (!porEmpresaMap.has(owner)) {
      porEmpresaMap.set(owner, { totalAnalises: 0, totalTokens: 0 });
    }
    const empresaStats = porEmpresaMap.get(owner)!;
    empresaStats.totalAnalises++;

    // Agrupamento por dia
    const dia = analise.created_at.substring(0, 10); // YYYY-MM-DD
    if (!porDiaMap.has(dia)) {
      porDiaMap.set(dia, { data: dia, totalAnalises: 0, totalTokens: 0, totalInput: 0, totalOutput: 0 });
    }
    const diaStats = porDiaMap.get(dia)!;
    diaStats.totalAnalises++;

    if (tokenUsage && tokenUsage.total_tokens > 0) {
      analisesComToken++;
      totalTokens += tokenUsage.total_tokens;
      totalInput += tokenUsage.prompt_tokens;
      totalOutput += tokenUsage.completion_tokens;
      empresaStats.totalTokens += tokenUsage.total_tokens;
      diaStats.totalTokens += tokenUsage.total_tokens;
      diaStats.totalInput += tokenUsage.prompt_tokens;
      diaStats.totalOutput += tokenUsage.completion_tokens;
    }
  }

  // Busca nomes das empresas
  const owners = Array.from(porEmpresaMap.keys());
  const { data: empresas } = await supabaseAdmin
    .from("config_empresas")
    .select("owner, nome_empresa")
    .in("owner", owners);

  const nomeMap = new Map<string, string>();
  (empresas || []).forEach((e) => nomeMap.set(e.owner, e.nome_empresa));

  const porEmpresa: EmpresaTokenStats[] = Array.from(porEmpresaMap.entries())
    .map(([owner, stats]) => ({
      owner,
      empresa: nomeMap.get(owner) || owner,
      totalAnalises: stats.totalAnalises,
      totalTokens: stats.totalTokens,
      mediaTokens: stats.totalAnalises > 0 ? Math.round(stats.totalTokens / stats.totalAnalises) : 0,
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);

  // Histórico diário (últimos 30 dias, ordenado por data)
  const historicoDiario = Array.from(porDiaMap.values())
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(-30);

  return {
    totalAnalises: analises.length,
    totalTokens,
    totalInput,
    totalOutput,
    mediaTokensPorAnalise: analisesComToken > 0 ? Math.round(totalTokens / analisesComToken) : 0,
    mediaInput: analisesComToken > 0 ? Math.round(totalInput / analisesComToken) : 0,
    mediaOutput: analisesComToken > 0 ? Math.round(totalOutput / analisesComToken) : 0,
    analisesComToken,
    analisesSemToken: analises.length - analisesComToken,
    porEmpresa,
    historicoDiario,
  };
}

function emptyStats(): TokenStats {
  return {
    totalAnalises: 0,
    totalTokens: 0,
    totalInput: 0,
    totalOutput: 0,
    mediaTokensPorAnalise: 0,
    mediaInput: 0,
    mediaOutput: 0,
    analisesComToken: 0,
    analisesSemToken: 0,
    porEmpresa: [],
    historicoDiario: [],
  };
}
