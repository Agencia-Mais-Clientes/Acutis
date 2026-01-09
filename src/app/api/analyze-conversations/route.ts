import { NextRequest, NextResponse } from "next/server";
import { processAllPendingChats } from "@/lib/analyze-service";
import type { AnalyzeRequest, AnalyzeResponse } from "@/lib/analyze-types";

export const maxDuration = 60; // 60 segundos de timeout

/**
 * POST /api/analyze-conversations
 * Endpoint para ser chamado pelo N8N ou cron
 * 
 * Body opcional:
 * {
 *   "ownerId": "string",       // Se não informado, processa todas empresas
 *   "batchSize": 10,           // Limite de chats por execução
 *   "dryRun": false,           // Se true, não salva no banco
 *   "origemFilter": "trafego_pago" | "organico" | "todos"  // Filtro de origem (default: usa config da empresa)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Validação de segurança (opcional - adicionar token se necessário)
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.ANALYZE_API_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse do body
    let body: AnalyzeRequest = {};
    try {
      body = await req.json();
    } catch {
      // Body vazio é permitido
    }

    const { ownerId, batchSize = 10, dryRun = false, origemFilter } = body;

    console.log("[ANALYZE API] Iniciando processamento", { 
      ownerId, 
      batchSize, 
      dryRun,
      origemFilter: origemFilter || "(usa config da empresa)"
    });

    // Executa processamento com filtro de origem
    const result = await processAllPendingChats(ownerId, batchSize, dryRun, origemFilter);

    console.log("[ANALYZE API] Processamento concluído", {
      processed: result.processed,
      errors: result.errors,
      skipped: result.skipped,
    });

    const response: AnalyzeResponse = {
      success: true,
      processed: result.processed,
      errors: result.errors,
      details: result.details.map((d) => ({
        chatid: d.chatid,
        status: d.status as "success" | "error" | "skipped",
        message: d.message,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[ANALYZE API] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analyze-conversations
 * Health check e status (pode ser usado por Vercel Cron no futuro)
 */
export async function GET(req: NextRequest) {
  // Verifica se é um cron job (para futuro uso)
  const isCron = req.headers.get("x-vercel-cron") === "1";

  if (isCron) {
    // Se for cron, executa processamento
    const result = await processAllPendingChats(undefined, 10, false);
    return NextResponse.json({
      success: true,
      message: "Cron executado",
      processed: result.processed,
    });
  }

  // Health check normal
  return NextResponse.json({
    success: true,
    message: "Analyze API is running",
    endpoints: {
      POST: "Processa chats pendentes",
      GET: "Health check / Cron",
    },
  });
}
