import { NextRequest, NextResponse } from "next/server";
import { processChat, getActiveChatsWithoutAnalysisFallback } from "@/lib/analyze-service";
import { supabaseAdmin } from "@/lib/supabase";
import type { ConfigEmpresa, OrigemFilter } from "@/lib/analyze-types";

export const maxDuration = 30;

/**
 * POST /api/analyze-conversations/single
 * Processa apenas 1 chat por vez para evitar timeout e rate limit
 * 
 * Body:
 * {
 *   "ownerId": "string",
 *   "origemFilter": "trafego_pago" | "organico" | "todos"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ownerId, origemFilter = "todos" } = body as { 
      ownerId: string; 
      origemFilter?: OrigemFilter;
    };

    if (!ownerId) {
      return NextResponse.json(
        { success: false, error: "ownerId é obrigatório" },
        { status: 400 }
      );
    }

    console.log(`[ANALYZE SINGLE] Buscando próximo chat para owner ${ownerId}`);

    // Busca config da empresa
    const { data: configData } = await supabaseAdmin
      .from("config_empresas")
      .select("*")
      .eq("owner", ownerId)
      .single();

    const config: ConfigEmpresa = configData || {
      owner: ownerId,
      nome_empresa: "",
      nicho: "",
      objetivo_conversao: "",
      created_at: "",
    };

    // Busca apenas 1 chat pendente
    const chats = await getActiveChatsWithoutAnalysisFallback(ownerId, 1, origemFilter);

    if (chats.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum chat pendente para analisar",
        hasMore: false,
        processed: 0,
      });
    }

    const chat = chats[0];
    console.log(`[ANALYZE SINGLE] Processando chat ${chat.chatid}`);

    const result = await processChat(chat, config, false);

    return NextResponse.json({
      success: result.status === "success",
      chatid: chat.chatid,
      status: result.status,
      message: result.message,
      hasMore: true, // Pode haver mais chats
    });
  } catch (error) {
    console.error("[ANALYZE SINGLE] Erro:", error);
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
 * GET /api/analyze-conversations/single?ownerId=XXX
 * Retorna quantidade de chats pendentes
 */
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  const origemFilter = (req.nextUrl.searchParams.get("origemFilter") || "todos") as OrigemFilter;

  if (!ownerId) {
    return NextResponse.json(
      { success: false, error: "ownerId é obrigatório" },
      { status: 400 }
    );
  }

  const chats = await getActiveChatsWithoutAnalysisFallback(ownerId, 100, origemFilter);

  return NextResponse.json({
    success: true,
    pendingChats: chats.length,
    chatIds: chats.map((c) => c.chatid),
  });
}
