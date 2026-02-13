// Mini-análise de alertas em tempo real via Gemini
// Prompt otimizado (~500 tokens) para detectar situações críticas rapidamente

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { MensagemCliente, ConfigEmpresa } from "@/lib/analyze-types";

// ============================================
// TIPOS
// ============================================

export interface AlertResult {
  needsAlert: boolean;
  alertType: AlertType | null;
  alertMessage: string | null;
  severity: "critical" | "warning" | null;
  detectedIssues: string[];
}

export type AlertType =
  | "sem_resposta"
  | "tom_agressivo"
  | "objecao_preco"
  | "interesse_caindo"
  | "venda_perdida";

// ============================================
// ANÁLISE
// ============================================

/**
 * Analisa últimas mensagens de um chat para detectar situações que exigem alerta imediato.
 * Usa prompt otimizado (~500 tokens) com temperature 0.3 para ser determinístico.
 */
export async function analyzeForAlerts(
  messages: MensagemCliente[],
  config: ConfigEmpresa
): Promise<AlertResult> {
  if (!messages || messages.length === 0) {
    return { needsAlert: false, alertType: null, alertMessage: null, severity: null, detectedIssues: [] };
  }

  // Formata mensagens para o prompt (compacto)
  const transcript = messages
    .slice(-20) // Últimas 20 mensagens
    .map((m) => {
      const actor = m.from_me ? "A" : "C"; // A=Atendente, C=Cliente
      const text = m.mensagem || "[mídia]";
      return `${actor}: ${text}`;
    })
    .join("\n");

  // Calcula tempo sem resposta (se última msg é do cliente)
  const lastMsg = messages[messages.length - 1];
  const timeSinceLastMsg = lastMsg && !lastMsg.from_me
    ? Math.floor((Date.now() - getTimestampMs(lastMsg)) / 60000)
    : 0;

  const systemPrompt = `Você é um detector de alertas para atendimento comercial via WhatsApp.
Empresa: ${config.nome_empresa || "Cliente"} (${config.nicho || "Vendas"})
Tempo sem resposta do atendente: ${timeSinceLastMsg} minutos

Analise a conversa e detecte APENAS situações CRÍTICAS que exigem ação IMEDIATA do gestor:

1. SEM_RESPOSTA: Cliente aguardando >30min no horário comercial (8h-18h)
2. TOM_AGRESSIVO: Atendente rude, grosseiro ou impaciente com o cliente
3. OBJECAO_PRECO: Cliente reclamou de preço e atendente NÃO contornou
4. INTERESSE_CAINDO: Cliente dando sinais de desistência ("vou pensar", "depois vejo")
5. VENDA_PERDIDA: Oportunidade clara perdida sem próximo passo definido

NÃO é alerta:
- Conversa fluindo normalmente
- Atendente respondeu em tempo ok
- Cliente apenas perguntando informações
- Saudações iniciais
- Conversa de suporte/pós-venda
- Menos de 3 mensagens trocadas

Responda APENAS JSON:
{"needsAlert":boolean,"alertType":"sem_resposta"|"tom_agressivo"|"objecao_preco"|"interesse_caindo"|"venda_perdida"|null,"alertMessage":"Frase curta descrevendo o problema"|null,"severity":"critical"|"warning"|null,"detectedIssues":["issue1"]}`;

  try {
    const { text, usage } = await generateText({
      model: google("gemini-2.5-flash-preview-09-2025"),
      system: systemPrompt,
      prompt: transcript,
      temperature: 0.3,
    });

    const promptTokens = usage?.inputTokens ?? 0;
    const completionTokens = usage?.outputTokens ?? 0;
    console.log(`[REALTIME] Tokens: ${promptTokens} + ${completionTokens} = ${promptTokens + completionTokens}`);

    const cleanJson = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanJson) as AlertResult;
  } catch (error) {
    console.error("[REALTIME] Erro na mini-análise:", error);
    return { needsAlert: false, alertType: null, alertMessage: null, severity: null, detectedIssues: [] };
  }
}

// ============================================
// UTILITÁRIOS
// ============================================

function getTimestampMs(msg: MensagemCliente): number {
  let ts = Number(msg.timestamp_ms || msg.timestamp);
  if (isNaN(ts)) return new Date(msg.recebido_em).getTime();
  if (ts < 10000000000) ts *= 1000;
  return ts;
}
