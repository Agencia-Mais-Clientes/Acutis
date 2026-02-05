import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { AnaliseConversa } from "@/lib/types";
import { getCategoriaObjecao } from "@/lib/objecao-utils";
import { validateSession } from "@/lib/auth-utils";
import { matchFase, CATEGORIA_OBJECAO_LABELS } from "@/lib/constants";

export const maxDuration = 30;

interface DailyReport {
  empresa: string;
  owner: string;
  periodo: string;
  metricas: {
    total_atendimentos: number;
    vendas: number;
    suporte: number;
    taxa_conversao: number;
    nota_media: number;
  };
  funil: {
    vendidos: number;
    agendados: number;
    em_negociacao: number;
    perdidos: number;
  };
  top_objecoes: { nome: string; quantidade: number }[];
  destaque_positivo: string | null;
  destaque_negativo: string | null;
  mensagem_resumo: string;
}

/**
 * GET /api/daily-report?ownerId=xxx
 * Gera relatório diário para uma empresa
 */
export async function GET(req: NextRequest) {
  try {
    const ownerId = req.nextUrl.searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json({ error: "ownerId obrigatório" }, { status: 400 });
    }

    // SEGURANÇA: Valida sessão ou aceita token API (para N8N/cron)
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.ANALYZE_API_TOKEN;
    const hasApiToken = expectedToken && authHeader === `Bearer ${expectedToken}`;

    if (!hasApiToken) {
      // Se não tem token API, valida sessão do usuário
      const session = await validateSession(ownerId);
      if (!session.isValid) {
        return NextResponse.json({ error: session.error || "Acesso negado" }, { status: 403 });
      }
    }

    // Busca config da empresa
    const { data: empresa } = await supabaseAdmin
      .from("config_empresas")
      .select("*")
      .eq("owner", ownerId)
      .single();

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // Busca análises das últimas 24h
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: analises } = await supabaseAdmin
      .from("analises_conversas")
      .select("*")
      .eq("owner", ownerId)
      .gte("created_at", ontem)
      .order("created_at", { ascending: false });

    const listaAnalises = (analises || []) as AnaliseConversa[];

    // Calcula métricas
    const vendas = listaAnalises.filter(
      (a) => a.resultado_ia?.tipo_conversacao === "Vendas"
    );
    const suporte = listaAnalises.filter(
      (a) => a.resultado_ia?.tipo_conversacao === "Suporte"
    );

    const vendidos = vendas.filter((a) => matchFase(a.resultado_ia?.funil_fase, "VENDIDO"));
    const agendados = vendas.filter((a) => matchFase(a.resultado_ia?.funil_fase, "AGENDADO"));
    const emNegociacao = vendas.filter((a) => matchFase(a.resultado_ia?.funil_fase, "NEGOCIACAO"));
    const perdidos = vendas.filter((a) => matchFase(a.resultado_ia?.funil_fase, "PERDIDO"));

    // Nota média
    const notas = listaAnalises
      .map((a) => a.resultado_ia?.nota_atendimento_0_100)
      .filter((n): n is number => typeof n === "number" && n > 0);
    const notaMedia =
      notas.length > 0 ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : 0;

    // Taxa de conversão
    const taxaConversao =
      vendas.length > 0
        ? Math.round(((vendidos.length + agendados.length) / vendas.length) * 100)
        : 0;

    // Top objeções
    const objecoesMap: Record<string, number> = {};
    vendas.forEach((a) => {
      (a.resultado_ia?.objecoes_detectadas || []).forEach((obj) => {
        if (obj) {
          const categoria = getCategoriaObjecao(obj);
          objecoesMap[categoria] = (objecoesMap[categoria] || 0) + 1;
        }
      });
    });
    const topObjecoes = Object.entries(objecoesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, quantidade]) => ({ nome: CATEGORIA_OBJECAO_LABELS[cat as keyof typeof CATEGORIA_OBJECAO_LABELS] || cat, quantidade }));

    // Destaque positivo (melhor nota)
    const melhorNota = listaAnalises.reduce(
      (best, a) => {
        const nota = a.resultado_ia?.nota_atendimento_0_100 || 0;
        return nota > best.nota ? { nota, nome: a.resultado_ia?.dados_cadastrais?.nome_vendedor || "Atendente" } : best;
      },
      { nota: 0, nome: "" }
    );

    // Destaque negativo (pior nota)
    const piorNota = listaAnalises.reduce(
      (worst, a) => {
        const nota = a.resultado_ia?.nota_atendimento_0_100 || 100;
        return nota < worst.nota && nota > 0 ? { nota, nome: a.resultado_ia?.dados_cadastrais?.nome_vendedor || "Atendente" } : worst;
      },
      { nota: 100, nome: "" }
    );

    // Mensagem de resumo
    const emojis = taxaConversao >= 30 ? "🎉" : taxaConversao >= 15 ? "📊" : "⚠️";
    const mensagemResumo = `${emojis} Ontem sua equipe atendeu ${listaAnalises.length} pessoas. ` +
      `Fechou ${vendidos.length + agendados.length} (${taxaConversao}%). ` +
      `Deixou ${perdidos.length} no vácuo. ` +
      `Nota média: ${notaMedia}/100.`;

    const report: DailyReport = {
      empresa: empresa.nome_empresa,
      owner: ownerId,
      periodo: `Últimas 24h (desde ${new Date(ontem).toLocaleString("pt-BR")})`,
      metricas: {
        total_atendimentos: listaAnalises.length,
        vendas: vendas.length,
        suporte: suporte.length,
        taxa_conversao: taxaConversao,
        nota_media: notaMedia,
      },
      funil: {
        vendidos: vendidos.length,
        agendados: agendados.length,
        em_negociacao: emNegociacao.length,
        perdidos: perdidos.length,
      },
      top_objecoes: topObjecoes,
      destaque_positivo: melhorNota.nota > 0 ? `${melhorNota.nome} (${melhorNota.nota}/100)` : null,
      destaque_negativo: piorNota.nota < 100 ? `${piorNota.nome} (${piorNota.nota}/100)` : null,
      mensagem_resumo: mensagemResumo,
    };

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("[DAILY-REPORT] Erro:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
