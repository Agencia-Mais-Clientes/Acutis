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
 * Processa apenas 1 chat por vez para evitar timeout e rate limit.
 * 
 * MODO AUTOMÁTICO (sem ownerId):
 *   - Busca TODAS empresas ativas
 *   - Para cada empresa, verifica se há chats pendentes
 *   - Processa o primeiro chat encontrado
 *   - Retorna hasMore=true se ainda houver mais chats em qualquer empresa
 * 
 * MODO MANUAL (com ownerId):
 *   - Processa apenas chats da empresa especificada
 * 
 * Body:
 * {
 *   "ownerId"?: "string",        // Opcional. Se omitido, itera TODAS empresas ativas
 *   "origemFilter"?: "trafego_pago" | "organico" | "todos",  // Default: "todos"
 *   "fromDate"?: "2026-02-01"    // Opcional. Só analisa chats a partir dessa data
 * }
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
      origemFilter?: OrigemFilter;
      fromDate?: string;
    } = {};
    try {
      body = await req.json();
    } catch {
      // Body vazio é permitido
    }

    const { ownerId, origemFilter = "todos", fromDate } = body;

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

    // Prioridade: tráfego pago primeiro, depois o resto
    // Quando origemFilter é "todos", faz 2 passadas:
    //   1ª) Busca chats de tráfego pago
    //   2ª) Se não houver, busca todos os restantes
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

        // Verifica se há MAIS chats pendentes (considerando prioridade)
        let hasMore = false;

        // Verifica se essa empresa tem mais com o filtro atual
        const moreInCompany = await getActiveChatsWithoutAnalysisFallback(
          company.owner,
          1,
          filtroAtual,
          fromDate
        );
        if (moreInCompany.length > 0) {
          hasMore = true;
        } else {
          // Verifica empresas restantes com filtro atual
          const currentIdx = companies.indexOf(company);
          for (let i = currentIdx + 1; i < companies.length; i++) {
            const moreChats = await getActiveChatsWithoutAnalysisFallback(
              companies[i].owner,
              1,
              filtroAtual,
              fromDate
            );
            if (moreChats.length > 0) {
              hasMore = true;
              break;
            }
          }
          // Se não tem mais do filtro atual, verifica filtros seguintes
          if (!hasMore) {
            const filtroIdx = filtrosEmOrdem.indexOf(filtroAtual);
            for (let f = filtroIdx + 1; f < filtrosEmOrdem.length; f++) {
              for (const c of companies) {
                const more = await getActiveChatsWithoutAnalysisFallback(
                  c.owner,
                  1,
                  filtrosEmOrdem[f],
                  fromDate
                );
                if (more.length > 0) {
                  hasMore = true;
                  break;
                }
              }
              if (hasMore) break;
            }
          }
        }

        return NextResponse.json({
          success: result.status === "success",
          chatid: chat.chatid,
          owner: company.owner,
          empresa: company.nome_empresa,
          origem: filtroAtual === "trafego_pago" ? "trafego_pago" : "organico/outros",
          status: result.status,
          message: result.message,
          hasMore,
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
