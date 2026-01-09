import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ============================================
// Tipos do payload da UazAPI
// ============================================

interface UazAPIWebhookPayload {
  body: {
    EventType: string;
    owner: string;
    token: string;
    chat: {
      wa_chatid: string;
      wa_name: string;
      wa_contactName?: string;
    };
    message: {
      id: string;
      messageid: string;
      chatid: string;
      text: string;
      fromMe: boolean;
      messageTimestamp: number;
      messageType: string;
      senderName?: string;
      content?: {
        text?: string;
        contextInfo?: {
          conversionSource?: string;        // "FB_Ads"
          conversionData?: string;
          externalAdReply?: {
            sourceType?: string;            // "ad"
            sourceID?: string;              // ID da campanha
            sourceApp?: string;             // "instagram" | "facebook"
            sourceURL?: string;
            ctwaClid?: string;              // Click ID
            body?: string;                  // Corpo do anúncio
            title?: string;                 // Título
            mediaType?: number;
            thumbnailURL?: string;
          };
          entryPointConversionSource?: string;  // "ctwa_ad"
          entryPointConversionApp?: string;     // "instagram"
        };
      };
    };
  };
}

interface OrigemDetectada {
  tipo: "facebook_ads" | "instagram_ads" | "google_ads" | "organico";
  source: string | null;
}

// ============================================
// Handler principal
// ============================================

export async function POST(req: NextRequest) {
  try {
    const data: UazAPIWebhookPayload = await req.json();
    
    // Log para debug (remover em produção)
    console.log("[Webhook UazAPI] Recebido:", {
      eventType: data.body?.EventType,
      owner: data.body?.owner,
      chatid: data.body?.chat?.wa_chatid,
    });
    
    // Só processa eventos de mensagem
    if (data.body?.EventType !== "messages") {
      return NextResponse.json({ ok: true, skipped: true, reason: "not_message_event" });
    }
    
    // Ignora mensagens enviadas pela empresa (fromMe = true)
    if (data.body.message?.fromMe) {
      return NextResponse.json({ ok: true, skipped: true, reason: "from_me" });
    }
    
    // Validação básica
    const { owner, chat, message } = data.body;
    if (!owner || !chat?.wa_chatid || !message) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }
    
    const chatid = chat.wa_chatid;
    const messageText = message.text || message.content?.text || "";
    
    // ============================================
    // 1. Verificar se já existe tracking para este chat
    // ============================================
    const { data: existingTracking } = await supabaseAdmin
      .from("lead_tracking")
      .select("id")
      .eq("chatid", chatid)
      .eq("owner", owner)
      .maybeSingle();
    
    // ============================================
    // 2. Se não existe tracking, é primeira mensagem - detectar origem
    // ============================================
    if (!existingTracking) {
      const origem = detectarOrigem(message);
      const contextInfo = message.content?.contextInfo;
      const adReply = contextInfo?.externalAdReply;
      
      const { error: trackingError } = await supabaseAdmin
        .from("lead_tracking")
        .insert({
          chatid,
          owner,
          origem: origem.tipo,
          campanha_id: adReply?.sourceID || null,
          source_app: adReply?.sourceApp || origem.source || null,
          ctwa_clid: adReply?.ctwaClid || null,
          ad_body: adReply?.body?.substring(0, 1000) || null,
          ad_title: adReply?.title?.substring(0, 255) || null,
          primeira_mensagem: messageText?.substring(0, 500) || null,
        });
      
      if (trackingError) {
        // Se for erro de duplicata, ignora (pode acontecer em requests paralelos)
        if (!trackingError.code?.includes("23505")) {
          console.error("[Webhook UazAPI] Erro ao salvar tracking:", trackingError);
        }
      } else {
        console.log("[Webhook UazAPI] Tracking criado:", {
          chatid,
          owner,
          origem: origem.tipo,
          campanha_id: adReply?.sourceID,
        });
      }
    }
    
    // ============================================
    // 3. Salvar mensagem em mensagens_clientes
    // ============================================
    const { error: messageError } = await supabaseAdmin
      .from("mensagens_clientes")
      .insert({
        chatid,
        owner,
        mensagem: messageText,
        from_me: false,
        timestamp_ms: message.messageTimestamp,
      });
    
    if (messageError) {
      // Log mas não falha - a mensagem pode já existir
      if (!messageError.code?.includes("23505")) {
        console.error("[Webhook UazAPI] Erro ao salvar mensagem:", messageError);
      }
    }
    
    return NextResponse.json({ 
      ok: true, 
      tracking: !existingTracking ? "created" : "exists",
      message: messageError ? "skipped" : "saved"
    });
    
  } catch (error) {
    console.error("[Webhook UazAPI] Erro geral:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error" }, 
      { status: 500 }
    );
  }
}

// ============================================
// Função de detecção de origem
// ============================================

function detectarOrigem(message: UazAPIWebhookPayload["body"]["message"]): OrigemDetectada {
  const contextInfo = message.content?.contextInfo;
  const adReply = contextInfo?.externalAdReply;
  
  // 1. Facebook/Instagram Ads (via contextInfo)
  // Detecta por conversionSource ou sourceType
  if (
    contextInfo?.conversionSource === "FB_Ads" || 
    contextInfo?.entryPointConversionSource === "ctwa_ad" ||
    adReply?.sourceType === "ad"
  ) {
    // Diferencia Instagram de Facebook
    const sourceApp = adReply?.sourceApp || contextInfo?.entryPointConversionApp;
    if (sourceApp === "instagram") {
      return { tipo: "instagram_ads", source: "instagram" };
    }
    return { tipo: "facebook_ads", source: "facebook" };
  }
  
  // 2. Google Ads (via palavra-chave no texto)
  // Detecta se a mensagem contém "google" mas não é sobre Google Meet/Drive/etc
  const texto = (message.text || message.content?.text || "").toLowerCase();
  if (texto.includes("google") && !texto.includes("meet") && !texto.includes("drive")) {
    return { tipo: "google_ads", source: "google" };
  }
  
  // 3. Orgânico (fallback)
  return { tipo: "organico", source: null };
}

// ============================================
// Handler GET para health check
// ============================================

export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    endpoint: "UazAPI Webhook Handler",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
}
