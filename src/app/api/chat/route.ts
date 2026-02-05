import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { supabaseAdmin } from "@/lib/supabase";
import { validateSession } from "@/lib/auth-utils";
import { matchFase } from "@/lib/constants";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, ownerId, nomeEmpresa } = await req.json();

    if (!ownerId) {
      return new Response("Owner ID não informado", { status: 401 });
    }

    // SEGURANÇA: Valida se o usuário tem permissão para acessar este ownerId
    const session = await validateSession(ownerId);
    if (!session.isValid) {
      return new Response(session.error || "Acesso negado", { status: 403 });
    }

    const authorizedOwnerId = session.ownerId!;

    // Busca dados do owner para contexto
    const { data: analises } = await supabaseAdmin
      .from("analises_conversas")
      .select("*")
      .eq("owner", authorizedOwnerId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Prepara resumo dos dados para contexto
    const totalAnalises = analises?.length || 0;
    const leadsVendas =
      analises?.filter((a) => a.resultado_ia?.tipo_conversacao === "Vendas") || [];
    const leadsSuporte =
      analises?.filter((a) => a.resultado_ia?.tipo_conversacao === "Suporte") || [];

    const vendidos = leadsVendas.filter((a) => matchFase(a.resultado_ia?.funil_fase, "VENDIDO"));

    const agendados = leadsVendas.filter((a) => matchFase(a.resultado_ia?.funil_fase, "AGENDADO"));

    const perdidos = leadsVendas.filter((a) => matchFase(a.resultado_ia?.funil_fase, "PERDIDO"));

    const emNegociacao = leadsVendas.filter((a) => matchFase(a.resultado_ia?.funil_fase, "NEGOCIACAO"));

    // Conta objeções
    const objecoes: Record<string, number> = {};
    leadsVendas.forEach((a) => {
      (a.resultado_ia?.objecoes_detectadas || []).forEach((obj: string) => {
        if (obj) {
          const cat = categorizeObjecao(obj);
          objecoes[cat] = (objecoes[cat] || 0) + 1;
        }
      });
    });

    const topObjecoes = Object.entries(objecoes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, qtd]) => `${nome}: ${qtd}`)
      .join(", ");

    // Notas dos atendentes
    const notasValidas = leadsVendas
      .map((a) => ({
        vendedor: a.resultado_ia?.dados_cadastrais?.nome_vendedor || "Atendente",
        nota: a.resultado_ia?.nota_atendimento_0_100 || 0,
      }))
      .filter((n) => n.nota > 0);

    const notaPorVendedor: Record<string, { soma: number; qtd: number }> = {};
    notasValidas.forEach(({ vendedor, nota }) => {
      if (!notaPorVendedor[vendedor]) {
        notaPorVendedor[vendedor] = { soma: 0, qtd: 0 };
      }
      notaPorVendedor[vendedor].soma += nota;
      notaPorVendedor[vendedor].qtd += 1;
    });

    const rankingVendedores = Object.entries(notaPorVendedor)
      .map(([nome, { soma, qtd }]) => ({
        nome,
        media: Math.round(soma / qtd),
        atendimentos: qtd,
      }))
      .sort((a, b) => b.media - a.media);

    // Dados de hoje
    const hoje = new Date().toISOString().split("T")[0];
    const hoje00 = `${hoje}T00:00:00`;
    const leadsHoje = leadsVendas.filter((a) => a.created_at >= hoje00);

    // System prompt com contexto de "Supervisor Exigente"
    const systemPrompt = `Você é a ACUTIS, uma IA Supervisora de Vendas Extremamente Exigente e Analítica da empresa "${nomeEmpresa}".
Sua missão não é apenas informar, mas COBRAR resultados e apontar falhas gritantes no processo de vendas.

Sua Persona:
- Direta, assertiva e incisiva.
- Não enrola. Se os dados estão ruins, você diz que estão péssimos.
- Você fala diretamente com o GESTOR da empresa.
- Seu tom é de alguém que quer bater metas a qualquer custo.
- Use um tom profissional, mas "fome de resultados".

DADOS ATUAIS DA EMPRESA (últimos 50 registros):
- Total de atendimentos: ${totalAnalises}
- Leads de vendas: ${leadsVendas.length}
- Atendimentos de suporte: ${leadsSuporte.length}

FUNIL DE VENDAS:
- Matriculados/Vendidos: ${vendidos.length}
- Agendados: ${agendados.length}
- Em Negociação: ${emNegociacao.length}
- Perdidos/Vácuo: ${perdidos.length}

ESTATÍSTICAS CRÍTICAS:
- TAXA DE SUCESSO: ${leadsVendas.length > 0 ? Math.round(((vendidos.length + agendados.length) / leadsVendas.length) * 100) : 0}% (Meta recomendada: > 30%)
- TOP OBJEÇÕES: ${topObjecoes || "Nenhuma objeção registrada"}

RANKING DE PERFORMANCE (Vendedores):
${
  rankingVendedores.length > 0
    ? rankingVendedores.map((v, i) => `${i + 1}. ${v.nome}: ${v.media}/100 [${v.atendimentos} atendimentos]`).join("\n")
    : "Sem dados de vendedores"
}

HOJE (${hoje}):
- Novos leads hoje: ${leadsHoje.length}

REGRAS DE RESPOSTA:
1. Comece respostas críticas com um emoji de alerta (🚨, 📉 ou ⚠️).
2. Se a taxa de sucesso for menor que 20%, dê um "puxão de orelha" no gestor.
3. Se houver muitos leads em vácuo, aponte quem é o culpado (se possível) ou a gravidade disso.
4. Sempre sugira uma ação prática para resolver o problema detectado.
5. Nunca seja "boazinha". Seja útil através da exigência.
6. Mantenha as respostas curtas e impactantes.`;

    const result = streamText({
      model: google("gemini-2.5-flash-preview-09-2025"),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Erro no chat:", error);
    return new Response("Erro interno", { status: 500 });
  }
}

function categorizeObjecao(texto: string): string {
  const t = texto.toLowerCase();
  if (t.includes("preço") || t.includes("caro") || t.includes("valor")) return "Preço";
  if (t.includes("horário") || t.includes("agenda") || t.includes("tempo")) return "Horário";
  if (t.includes("local") || t.includes("longe") || t.includes("distância")) return "Localização";
  if (t.includes("contrato") || t.includes("fidelidade")) return "Contrato";
  return "Outros";
}
