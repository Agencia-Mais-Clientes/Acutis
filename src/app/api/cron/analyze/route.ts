import { NextRequest, NextResponse } from "next/server";
import {
  getActiveCompanies,
  getActiveChatsWithoutAnalysisFallback,
  processChat,
} from "@/lib/analyze-service";
import type { ConfigEmpresa, OrigemFilter } from "@/lib/analyze-types";

export const maxDuration = 300; // 5 minutos (requer Vercel Pro, falha graciosamente em Hobby)

interface CronRequest {
  maxPerCompany?: number;
  maxTotal?: number;
}

interface CompanyReport {
  owner: string;
  empresa: string;
  trafegoPago: { processed: number; skipped: number; errors: number };
  organico: { processed: number; skipped: number; errors: number };
}

/**
 * POST /api/cron/analyze
 * 
 * Endpoint de orquestração para o N8N.
 * Busca todas as empresas ativas e processa chats pendentes.
 * Prioridade: tráfego pago primeiro, depois orgânicos.
 * 
 * Body (opcional):
 * {
 *   "maxPerCompany": 20,  // Max chats por empresa por fase (default: 20)
 *   "maxTotal": 100        // Max chats total na execução (default: 100)
 * }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Auth via Bearer token
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.ANALYZE_API_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse body
    let body: CronRequest = {};
    try {
      body = await req.json();
    } catch {
      // Body vazio é permitido
    }

    const maxPerCompany = body.maxPerCompany || 20;
    const maxTotal = body.maxTotal || 100;

    console.log("[CRON ANALYZE] Iniciando execução automática", {
      maxPerCompany,
      maxTotal,
      startedAt: new Date().toISOString(),
    });

    // 1. Busca empresas ativas
    const companies = await getActiveCompanies();
    console.log(`[CRON ANALYZE] ${companies.length} empresa(s) ativa(s)`);

    if (companies.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma empresa ativa encontrada",
        companies: [],
        totalProcessed: 0,
        totalErrors: 0,
        totalSkipped: 0,
        durationMs: Date.now() - startTime,
      });
    }

    // 2. Processa cada empresa
    const reports: CompanyReport[] = [];
    let totalProcessed = 0;
    let totalErrors = 0;
    let totalSkipped = 0;

    for (const company of companies) {
      // Safety: verifica se atingiu o limite global
      if (totalProcessed + totalErrors >= maxTotal) {
        console.log(`[CRON ANALYZE] Limite global (${maxTotal}) atingido, parando`);
        break;
      }

      // Safety: verifica tempo restante (para 50s antes do timeout)
      const elapsed = Date.now() - startTime;
      if (elapsed > 250000) { // 4min10s — para antes do timeout de 5min
        console.log(`[CRON ANALYZE] ⚠️ Tempo quase esgotado (${Math.round(elapsed / 1000)}s), parando`);
        break;
      }

      const report: CompanyReport = {
        owner: company.owner,
        empresa: company.nome_empresa,
        trafegoPago: { processed: 0, skipped: 0, errors: 0 },
        organico: { processed: 0, skipped: 0, errors: 0 },
      };

      console.log(`[CRON ANALYZE] === Empresa: ${company.nome_empresa} (${company.owner}) ===`);

      // Fase 1: Tráfego Pago (prioridade)
      const fase1 = await processCompanyChats(
        company,
        "trafego_pago",
        Math.min(maxPerCompany, maxTotal - totalProcessed - totalErrors),
        startTime
      );
      report.trafegoPago = fase1;
      totalProcessed += fase1.processed;
      totalErrors += fase1.errors;
      totalSkipped += fase1.skipped;

      // Fase 2: Orgânicos (se ainda tem budget)
      if (totalProcessed + totalErrors < maxTotal) {
        const fase2 = await processCompanyChats(
          company,
          "organico",
          Math.min(maxPerCompany, maxTotal - totalProcessed - totalErrors),
          startTime
        );
        report.organico = fase2;
        totalProcessed += fase2.processed;
        totalErrors += fase2.errors;
        totalSkipped += fase2.skipped;
      }

      reports.push(report);
    }

    const durationMs = Date.now() - startTime;
    console.log(`[CRON ANALYZE] ✅ Concluído em ${Math.round(durationMs / 1000)}s`, {
      totalProcessed,
      totalErrors,
      totalSkipped,
      companiesProcessed: reports.length,
    });

    return NextResponse.json({
      success: true,
      companies: reports,
      totalProcessed,
      totalErrors,
      totalSkipped,
      companiesProcessed: reports.length,
      companiesTotal: companies.length,
      durationMs,
    });
  } catch (error) {
    console.error("[CRON ANALYZE] ❌ Erro fatal:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno",
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Processa chats de uma empresa para uma fase específica (tráfego ou orgânico)
 */
async function processCompanyChats(
  company: ConfigEmpresa,
  origemFilter: OrigemFilter,
  maxChats: number,
  startTime: number
): Promise<{ processed: number; skipped: number; errors: number }> {
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`[CRON ANALYZE] Fase '${origemFilter}' para ${company.nome_empresa} (max: ${maxChats})`);

  // Busca chats pendentes
  const chats = await getActiveChatsWithoutAnalysisFallback(
    company.owner,
    maxChats,
    origemFilter
  );

  if (chats.length === 0) {
    console.log(`[CRON ANALYZE] Nenhum chat pendente (${origemFilter})`);
    return { processed, skipped, errors };
  }

  console.log(`[CRON ANALYZE] ${chats.length} chats pendentes (${origemFilter})`);

  for (const chat of chats) {
    // Safety: verifica tempo restante
    const elapsed = Date.now() - startTime;
    if (elapsed > 250000) {
      console.log(`[CRON ANALYZE] ⚠️ Tempo quase esgotado, parando fase`);
      break;
    }

    try {
      const result = await processChat(chat, company, false);

      if (result.status === "success") {
        processed++;
        console.log(`[CRON ANALYZE] ✅ ${chat.chatid} processado`);
      } else if (result.status === "skipped") {
        skipped++;
      } else {
        errors++;
        console.log(`[CRON ANALYZE] ❌ ${chat.chatid}: ${result.message}`);
      }
    } catch (err) {
      errors++;
      console.error(`[CRON ANALYZE] ❌ Erro no chat ${chat.chatid}:`, err);
    }

    // Rate limiting: 5s entre análises (respeita Gemini API)
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log(`[CRON ANALYZE] Fase '${origemFilter}': ${processed} ok, ${skipped} pulados, ${errors} erros`);
  return { processed, skipped, errors };
}

/**
 * GET /api/cron/analyze
 * Health check — status do sistema de análise
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedToken = process.env.ANALYZE_API_TOKEN;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const companies = await getActiveCompanies();

  return NextResponse.json({
    success: true,
    message: "Cron Analyze API is running",
    activeCompanies: companies.length,
    companiesList: companies.map((c) => ({
      owner: c.owner,
      empresa: c.nome_empresa,
      ativo: c.ativo,
      origemFilter: c.analise_origem_filter || "trafego_pago",
    })),
  });
}
