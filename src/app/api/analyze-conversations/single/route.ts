import { NextRequest, NextResponse } from "next/server";
import {
  processChat,
  getActiveChatsWithoutAnalysisFallback,
  getActiveCompanies,
} from "@/lib/analyze-service";
import { supabaseAdmin } from "@/lib/supabase";
import type { ConfigEmpresa, OrigemFilter } from "@/lib/analyze-types";

export const maxDuration = 30;

/**
 * POST /api/analyze-conversations/single
 * Processa apenas 1 chat por vez com ROUND-ROBIN entre empresas.
 * 
 * Cada chamada processa 1 chat e retorna o `nextOwner` para que a
 * próxima chamada comece da empresa seguinte — garantindo que TODAS
 * as empresas sejam processadas, não apenas a primeira.
 * 
 * Body:
 * {
 *   "ownerId"?: "string",        // Modo manual: apenas essa empresa
 *   "lastOwner"?: "string",      // Round-robin: começa APÓS esta empresa
 *   "origemFilter"?: "trafego_pago" | "organico" | "todos",
 *   "fromDate"?: "2026-02-01"
 * }
 * 
 * Response inclui:
 *   - nextOwner: passar como lastOwner na próxima chamada
 *   - hasMore: true se processou algo (provavelmente há mais)
 */
export async function POST(req: NextRequest) {
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

    let body: {
      ownerId?: string;
      lastOwner?: string;
      origemFilter?: OrigemFilter;
      fromDate?: string;
    } = {};
    try {
      body = await req.json();
    } catch {
      // Body vazio é permitido
    }

    const { ownerId, lastOwner, origemFilter = "todos", fromDate } = body;

    // Determina empresas para processar
    let companies: ConfigEmpresa[];

    if (ownerId) {
      // Modo manual: apenas a empresa especificada
      const { data: configData } = await supabaseAdmin
        .from("config_empresas")
        .select("*")
        .eq("owner", ownerId)
        .single();

      companies = configData
        ? [configData as ConfigEmpresa]
        : [
            {
              owner: ownerId,
              nome_empresa: "",
              nicho: "",
              objetivo_conversao: "",
              created_at: "",
            },
          ];
    } else {
      // Modo automático: TODAS empresas ativas
      companies = await getActiveCompanies();
    }

    if (companies.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma empresa ativa encontrada",
        hasMore: false,
        processed: 0,
      });
    }

    // Round-robin: reordena a lista para começar APÓS lastOwner
    if (lastOwner && companies.length > 1) {
      const lastIdx = companies.findIndex(c => c.owner === lastOwner);
      if (lastIdx !== -1) {
        // Rotaciona: empresas após lastOwner vêm primeiro, depois as anteriores
        const rotated = [
          ...companies.slice(lastIdx + 1),
          ...companies.slice(0, lastIdx + 1),
        ];
        companies = rotated;
        console.log(`[ANALYZE SINGLE] Round-robin: começando após ${lastOwner} (${companies[0]?.nome_empresa})`);
      }
    }

    // Prioridade: tráfego pago primeiro, depois o resto
    const filtrosEmOrdem: OrigemFilter[] =
      origemFilter === "todos"
        ? ["trafego_pago", "todos"]
        : [origemFilter];

    for (const filtroAtual of filtrosEmOrdem) {
      for (const company of companies) {
        const chats = await getActiveChatsWithoutAnalysisFallback(
          company.owner,
          1,
          filtroAtual,
          fromDate
        );

        if (chats.length === 0) {
          continue;
        }

        const chat = chats[0];
        console.log(
          `[ANALYZE SINGLE] Processando chat ${chat.chatid} (Empresa: ${company.nome_empresa || company.owner}, Filtro: ${filtroAtual})`
        );

        const result = await processChat(chat, company, false);

        return NextResponse.json({
          success: result.status === "success",
          chatid: chat.chatid,
          owner: company.owner,
          empresa: company.nome_empresa,
          nextOwner: company.owner, // N8N deve passar isso como lastOwner na próxima chamada
          origem: filtroAtual === "trafego_pago" ? "trafego_pago" : "organico/outros",
          status: result.status,
          message: result.message,
          hasMore: true, // Se processou algo, provavelmente há mais
        });
      }
    }

    // Nenhuma empresa tinha chats pendentes
    return NextResponse.json({
      success: true,
      message: "Nenhum chat pendente para analisar em nenhuma empresa",
      hasMore: false,
      processed: 0,
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
 * Retorna quantidade de chats pendentes.
 * Se ownerId não for informado, retorna total de TODAS empresas.
 */
export async function GET(req: NextRequest) {
  // Auth via Bearer token
  const authHeader = req.headers.get("authorization");
  const expectedToken = process.env.ANALYZE_API_TOKEN;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const ownerId = req.nextUrl.searchParams.get("ownerId");
  const origemFilter = (req.nextUrl.searchParams.get("origemFilter") ||
    "todos") as OrigemFilter;
  const fromDate =
    req.nextUrl.searchParams.get("fromDate") || undefined;

  if (ownerId) {
    // Modo específico
    const chats = await getActiveChatsWithoutAnalysisFallback(
      ownerId,
      100,
      origemFilter,
      fromDate
    );

    return NextResponse.json({
      success: true,
      pendingChats: chats.length,
      chatIds: chats.map((c) => c.chatid),
    });
  }

  // Modo global: conta chats de TODAS empresas
  const companies = await getActiveCompanies();
  const summary: {
    owner: string;
    empresa: string;
    pendingChats: number;
  }[] = [];
  let totalPending = 0;

  for (const company of companies) {
    const chats = await getActiveChatsWithoutAnalysisFallback(
      company.owner,
      100,
      origemFilter,
      fromDate
    );
    summary.push({
      owner: company.owner,
      empresa: company.nome_empresa,
      pendingChats: chats.length,
    });
    totalPending += chats.length;
  }

  return NextResponse.json({
    success: true,
    totalPending,
    companies: summary,
  });
}
