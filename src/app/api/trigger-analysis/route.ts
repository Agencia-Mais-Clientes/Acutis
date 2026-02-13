import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/trigger-analysis
 * Chamado pelo N8N a cada mensagem recebida no WhatsApp.
 * Faz upsert na fila de debounce (analise_pendente) com agendado_para = now + 60s.
 * Se o chat já está na fila, apenas reseta o timer de debounce.
 *
 * Body: { chatid: string, owner: string }
 * Auth: Bearer ANALYZE_API_TOKEN
 */
export async function POST(req: NextRequest) {
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

    // Parse body
    const body = await req.json();
    let { chatid, owner } = body as { chatid?: string; owner?: string };

    if (!chatid || !owner) {
      return NextResponse.json(
        { success: false, error: "chatid e owner são obrigatórios" },
        { status: 400 }
      );
    }

    // Normaliza chatid (adiciona @s.whatsapp.net se necessário)
    if (!chatid.includes("@")) {
      chatid = `${chatid}@s.whatsapp.net`;
    }

    // Ignora grupos
    if (chatid.endsWith("@g.us")) {
      return NextResponse.json({ success: true, action: "ignored_group" });
    }

    // Upsert: insere ou reseta o debounce para 60s
    const { error } = await supabaseAdmin
      .from("analise_pendente")
      .upsert(
        {
          chatid,
          owner,
          agendado_para: new Date(Date.now() + 60 * 1000).toISOString(),
          processado: false,
          resultado_alerta: null,
        },
        {
          onConflict: "chatid,owner",
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error("[TRIGGER] Erro no upsert:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, action: "queued" });
  } catch (error) {
    console.error("[TRIGGER] Erro:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trigger-analysis
 * Health check: retorna tamanho da fila de pendentes
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

  const { count, error } = await supabaseAdmin
    .from("analise_pendente")
    .select("id", { count: "exact", head: true })
    .eq("processado", false);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Trigger Analysis API is running",
    pendingCount: count ?? 0,
  });
}
