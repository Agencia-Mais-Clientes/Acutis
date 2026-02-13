// Serviço de envio de alertas via WhatsApp para gestores

import { supabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/uazapi";
import type { AlertResult } from "@/lib/realtime-analysis";

// ============================================
// TIPOS
// ============================================

interface Gestor {
  id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
}

interface EmpresaConfig {
  owner: string;
  nome_empresa: string;
  instance_token: string | null;
}

// ============================================
// ENVIO DE ALERTAS
// ============================================

/**
 * Envia alerta via WhatsApp para todos os gestores ativos vinculados à empresa.
 *
 * @param chatid - ID do chat que gerou o alerta
 * @param owner - Owner da empresa
 * @param alertResult - Resultado da mini-análise
 * @param nomeEmpresa - Nome da empresa (para a mensagem)
 */
export async function sendAlert(
  chatid: string,
  owner: string,
  alertResult: AlertResult,
  nomeEmpresa: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // 1. Busca gestores ativos vinculados à empresa
  const gestores = await getGestoresAtivos(owner);
  if (gestores.length === 0) {
    console.warn(`[ALERT] Nenhum gestor ativo com telefone para empresa ${owner}`);
    return { sent: 0, failed: 0 };
  }

  // 2. Busca instance_token da empresa
  const instanceToken = await getInstanceToken(owner);
  if (!instanceToken) {
    console.error(`[ALERT] Sem instance_token para empresa ${owner}`);
    return { sent: 0, failed: gestores.length };
  }

  // 3. Extrai telefone do cliente do chatid
  const clientPhone = extractPhoneFromChatId(chatid);

  // 4. Formata mensagem do alerta
  const message = formatAlertMessage(alertResult, nomeEmpresa, clientPhone);

  // 5. Envia para cada gestor
  for (const gestor of gestores) {
    if (!gestor.telefone) continue;

    const success = await sendWhatsAppMessage(
      gestor.telefone,
      message,
      instanceToken
    );

    if (success) {
      sent++;
      console.log(`[ALERT] Alerta enviado para gestor ${gestor.nome} (${gestor.telefone})`);
    } else {
      failed++;
      console.error(`[ALERT] Falha ao enviar para gestor ${gestor.nome} (${gestor.telefone})`);
    }
  }

  return { sent, failed };
}

// ============================================
// QUERIES
// ============================================

async function getGestoresAtivos(owner: string): Promise<Gestor[]> {
  const { data, error } = await supabaseAdmin
    .from("gestor_empresa")
    .select(`
      gestores!inner (
        id,
        nome,
        telefone,
        ativo
      )
    `)
    .eq("empresa_owner", owner);

  if (error) {
    console.error("[ALERT] Erro ao buscar gestores:", error);
    return [];
  }

  // Filtra gestores ativos com telefone
  const gestores: Gestor[] = [];
  for (const row of data || []) {
    const g = row.gestores as unknown as Gestor;
    if (g && g.ativo && g.telefone) {
      gestores.push(g);
    }
  }

  return gestores;
}

async function getInstanceToken(owner: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("config_empresas")
    .select("instance_token")
    .eq("owner", owner)
    .single();

  if (error || !data) {
    return null;
  }

  return data.instance_token || null;
}

// ============================================
// FORMATAÇÃO
// ============================================

function extractPhoneFromChatId(chatid: string): string {
  // Remove @s.whatsapp.net e formata
  const phone = chatid.replace("@s.whatsapp.net", "").replace(/\D/g, "");
  if (phone.length >= 12) {
    // Formato: +55 (11) 99999-9999
    return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
  }
  return phone;
}

function formatAlertMessage(
  alertResult: AlertResult,
  nomeEmpresa: string,
  clientPhone: string
): string {
  const severityEmoji = alertResult.severity === "critical" ? "\u{1F6A8}" : "\u26A0\uFE0F";
  const typeLabels: Record<string, string> = {
    sem_resposta: "Cliente sem resposta",
    tom_agressivo: "Tom agressivo detectado",
    objecao_preco: "Objeção de preço não tratada",
    interesse_caindo: "Lead perdendo interesse",
    venda_perdida: "Venda sendo perdida",
  };

  const typeLabel = alertResult.alertType
    ? typeLabels[alertResult.alertType] || alertResult.alertType
    : "Alerta";

  const issues = alertResult.detectedIssues.length > 0
    ? `\n\nProblemas:\n${alertResult.detectedIssues.map(i => `- ${i}`).join("\n")}`
    : "";

  return `${severityEmoji} *ALERTA - ${nomeEmpresa}*

*${typeLabel}*
${alertResult.alertMessage || ""}

Cliente: ${clientPhone}${issues}

_Acutis - Alerta Automático_`;
}
