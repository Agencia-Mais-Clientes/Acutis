import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { analyzeForAlerts } from "@/lib/realtime-analysis";
import { sendAlert } from "@/lib/alert-sender";
import type { MensagemCliente, ConfigEmpresa } from "@/lib/analyze-types";

export const maxDuration = 55; // Cabe no Hobby 60s do Vercel

/**
 * POST /api/process-pending
 * Worker chamado pelo N8N a cada 1 minuto.
 * Busca registros prontos (agendado_para <= now AND processado = false),
 * roda mini-análise Gemini e envia alerta se necessário.
 *
 * Auth: Bearer ANALYZE_API_TOKEN
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Auth
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.ANALYZE_API_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Busca até 5 registros prontos para processar
    const { data: pendentes, error: fetchError } = await supabaseAdmin
      .from("analise_pendente")
      .select("*")
      .eq("processado", false)
      .lte("agendado_para", new Date().toISOString())
      .order("agendado_para", { ascending: true })
      .limit(5);

    if (fetchError) {
      console.error("[WORKER] Erro ao buscar pendentes:", fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!pendentes || pendentes.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "Nenhum pendente",
      });
    }

    console.log(`[WORKER] Processando ${pendentes.length} chat(s) pendente(s)`);

    const results: { chatid: string; alerted: boolean; error?: string }[] = [];

    for (const pendente of pendentes) {
      // Safety: para aos 50s para não estourar o timeout
      if (Date.now() - startTime > 50000) {
        console.warn("[WORKER] Tempo limite atingido, parando processamento");
        break;
      }

      try {
        // 1. Busca últimas 20 mensagens do chat
        const messages = await getRecentMessages(pendente.chatid, pendente.owner);

        if (messages.length < 3) {
          // Poucas mensagens, marca como processado sem alertar
          await markAsProcessed(pendente.id, { needsAlert: false, reason: "too_few_messages" });
          results.push({ chatid: pendente.chatid, alerted: false });
          continue;
        }

        // 2. Busca config da empresa
        const config = await getCompanyConfig(pendente.owner);
        if (!config) {
          await markAsProcessed(pendente.id, { needsAlert: false, reason: "company_not_found" });
          results.push({ chatid: pendente.chatid, alerted: false, error: "Empresa não encontrada" });
          continue;
        }

        // 3. Mini-análise via Gemini
        const alertResult = await analyzeForAlerts(messages, config);

        // 4. Se precisa alertar, envia WhatsApp
        if (alertResult.needsAlert) {
          console.log(`[WORKER] Alerta detectado para ${pendente.chatid}: ${alertResult.alertType}`);
          const { sent, failed } = await sendAlert(
            pendente.chatid,
            pendente.owner,
            alertResult,
            config.nome_empresa
          );
          console.log(`[WORKER] Alertas enviados: ${sent} ok, ${failed} falha`);
        }

        // 5. Marca como processado
        await markAsProcessed(pendente.id, alertResult);
        results.push({ chatid: pendente.chatid, alerted: alertResult.needsAlert });

        // Rate limit: 2s entre chamadas ao Gemini
        await sleep(2000);
      } catch (error) {
        console.error(`[WORKER] Erro no chat ${pendente.chatid}:`, error);
        results.push({
          chatid: pendente.chatid,
          alerted: false,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    const alertedCount = results.filter((r) => r.alerted).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      alerted: alertedCount,
      results,
    });
  } catch (error) {
    console.error("[WORKER] Erro geral:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/process-pending
 * Health check
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

  const { count } = await supabaseAdmin
    .from("analise_pendente")
    .select("id", { count: "exact", head: true })
    .eq("processado", false);

  return NextResponse.json({
    success: true,
    message: "Process Pending API is running",
    pendingCount: count ?? 0,
  });
}

// ============================================
// HELPERS
// ============================================

async function getRecentMessages(chatid: string, owner: string): Promise<MensagemCliente[]> {
  const { data, error } = await supabaseAdmin
    .from("mensagens_clientes")
    .select("*")
    .eq("chatid", chatid)
    .eq("owner", owner)
    .order("id", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[WORKER] Erro ao buscar mensagens:", error);
    return [];
  }

  // Reverte para ordem cronológica
  return (data as MensagemCliente[]).reverse();
}

async function getCompanyConfig(owner: string): Promise<ConfigEmpresa | null> {
  const { data, error } = await supabaseAdmin
    .from("config_empresas")
    .select("*")
    .eq("owner", owner)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ConfigEmpresa;
}

async function markAsProcessed(id: string, resultado: unknown): Promise<void> {
  const { error } = await supabaseAdmin
    .from("analise_pendente")
    .update({
      processado: true,
      resultado_alerta: resultado,
    })
    .eq("id", id);

  if (error) {
    console.error("[WORKER] Erro ao marcar como processado:", error);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
