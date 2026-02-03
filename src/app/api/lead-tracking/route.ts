import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ============================================
// Tipos
// ============================================

interface LeadTrackingInput {
  telefone: string;          // Telefone do lead (vai virar chatid)
  owner: string;             // Owner da empresa
  origem: string;            // Origem flexível (normalizada internamente)
  nome_lead?: string;        // Nome do lead (opcional)
  campanha_id?: string;      // ID da campanha (opcional)
  ad_title?: string;         // Título do anúncio (opcional)
  ad_body?: string;          // Corpo do anúncio (opcional)
  primeira_mensagem?: string; // Primeira mensagem enviada (opcional)
  detected_at?: string;      // Data de entrada (formato flexível)
}

interface BulkImportInput {
  leads: LeadTrackingInput[];
}

// ============================================
// Mapeamento de Origem (Planilha → Banco)
// ============================================

const ORIGEM_MAP: Record<string, string> = {
  // Da planilha
  "facebook": "facebook_ads",
  "instagram": "instagram_ads",
  "google": "google_ads",
  "meta": "facebook_ads",
  // Já normalizados
  "facebook_ads": "facebook_ads",
  "instagram_ads": "instagram_ads",
  "google_ads": "google_ads",
  "organico": "organico",
  "orgânico": "organico",
  // Fallback
  "": "organico",
};

/**
 * Normaliza origem da planilha para formato do banco
 * Ex: "Facebook" -> "facebook_ads", "Instagram" -> "instagram_ads"
 */
function normalizarOrigem(origem: string): string {
  const origemLower = (origem || "").toLowerCase().trim();
  return ORIGEM_MAP[origemLower] || "organico";
}

/**
 * Converte data brasileira para ISO
 * Ex: "10-09-2025 às 20:24:02" -> "2025-09-10T20:24:02.000Z"
 */
function parseDataBrasileira(data: string): string {
  if (!data) return new Date().toISOString();
  
  // Já é ISO?
  if (data.includes("T") && data.includes("Z")) return data;
  
  // Formato: "10-09-2025 às 20:24:02" ou "23/09/2025, 18:58:06"
  const cleanData = data
    .replace(" às ", " ")
    .replace(", ", " ")
    .replace(/[\/\-]/g, "-");
  
  // Extrai partes
  const match = cleanData.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, dia, mes, ano, hora, min, seg] = match;
    return new Date(`${ano}-${mes}-${dia}T${hora}:${min}:${seg}-03:00`).toISOString();
  }
  
  // Tenta parse direto
  try {
    return new Date(data).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// ============================================
// Utilitários
// ============================================

/**
 * Normaliza telefone para formato chatid WhatsApp
 * Ex: "+55 11 91234-5678" -> "5511912345678@s.whatsapp.net"
 */
function normalizeTelefone(telefone: string): string {
  // Remove tudo que não é número
  const numbersOnly = telefone.replace(/\D/g, "");
  
  // Adiciona 55 se não tiver código do país
  const withCountry = numbersOnly.length <= 11 
    ? `55${numbersOnly}` 
    : numbersOnly;
  
  // Adiciona sufixo do WhatsApp
  return `${withCountry}@s.whatsapp.net`;
}

/**
 * Valida se o owner existe na tabela config_empresas
 */
async function validarOwner(owner: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("config_empresas")
    .select("owner")
    .eq("owner", owner)
    .maybeSingle();
  
  return !!data;
}

// ============================================
// POST - Criar um lead tracking
// ============================================

export async function POST(req: NextRequest) {
  try {
    // Validação de token (opcional)
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.ANALYZE_API_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // ============================================
    // Modo Bulk (múltiplos leads)
    // ============================================
    if (body.leads && Array.isArray(body.leads)) {
      const bulkData = body as BulkImportInput;
      const results = {
        inserted: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const lead of bulkData.leads) {
        try {
          const chatid = normalizeTelefone(lead.telefone);
          
          // Valida owner
          const ownerValido = await validarOwner(lead.owner);
          if (!ownerValido) {
            results.errors.push(`Owner ${lead.owner} não encontrado para telefone ${lead.telefone}`);
            continue;
          }

          // Tenta inserir (ignora se já existir)
          const { error } = await supabaseAdmin
            .from("lead_tracking")
            .upsert({
              chatid,
              owner: lead.owner,
              origem: normalizarOrigem(lead.origem),
              campanha_id: lead.campanha_id || null,
              ad_title: lead.ad_title || null,
              ad_body: lead.ad_body || null,
              primeira_mensagem: lead.primeira_mensagem?.substring(0, 500) || null,
              detected_at: parseDataBrasileira(lead.detected_at || ""),
            }, {
              onConflict: "chatid,owner",
              ignoreDuplicates: false, // Atualiza se existir
            });

          if (error) {
            results.errors.push(`Erro para ${lead.telefone}: ${error.message}`);
          } else {
            results.inserted++;
          }
        } catch (err) {
          results.errors.push(`Erro inesperado para ${lead.telefone}: ${err}`);
        }
      }

      return NextResponse.json({
        success: true,
        mode: "bulk",
        ...results,
      });
    }

    // ============================================
    // Modo Single (um lead)
    // ============================================
    const lead = body as LeadTrackingInput;

    // Validações
    if (!lead.telefone || !lead.owner || !lead.origem) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios: telefone, owner, origem" },
        { status: 400 }
      );
    }

    // Valida owner
    const ownerValido = await validarOwner(lead.owner);
    if (!ownerValido) {
      return NextResponse.json(
        { success: false, error: `Owner ${lead.owner} não encontrado em config_empresas` },
        { status: 400 }
      );
    }

    // Normaliza telefone
    const chatid = normalizeTelefone(lead.telefone);

    // Upsert no banco
    const { data, error } = await supabaseAdmin
      .from("lead_tracking")
      .upsert({
        chatid,
        owner: lead.owner,
        origem: normalizarOrigem(lead.origem),
        campanha_id: lead.campanha_id || null,
        ad_title: lead.ad_title || null,
        ad_body: lead.ad_body || null,
        primeira_mensagem: lead.primeira_mensagem?.substring(0, 500) || null,
        detected_at: parseDataBrasileira(lead.detected_at || ""),
      }, {
        onConflict: "chatid,owner",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[Lead Tracking API] Erro ao inserir:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mode: "single",
      data: {
        id: data.id,
        chatid: data.chatid,
        origem: data.origem,
      },
    });

  } catch (error) {
    console.error("[Lead Tracking API] Erro geral:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Listar/consultar leads
// ============================================

export async function GET(req: NextRequest) {
  try {
    // Validação de token
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.ANALYZE_API_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const owner = url.searchParams.get("owner");
    const origem = url.searchParams.get("origem");
    const limit = parseInt(url.searchParams.get("limit") || "100");

    let query = supabaseAdmin
      .from("lead_tracking")
      .select("*")
      .order("detected_at", { ascending: false })
      .limit(limit);

    if (owner) {
      query = query.eq("owner", owner);
    }

    if (origem) {
      query = query.eq("origem", origem);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Estatísticas por origem
    const stats = {
      total: data?.length || 0,
      facebook_ads: data?.filter(l => l.origem === "facebook_ads").length || 0,
      instagram_ads: data?.filter(l => l.origem === "instagram_ads").length || 0,
      google_ads: data?.filter(l => l.origem === "google_ads").length || 0,
      organico: data?.filter(l => l.origem === "organico").length || 0,
    };

    return NextResponse.json({
      success: true,
      stats,
      leads: data,
    });

  } catch (error) {
    console.error("[Lead Tracking API] Erro geral:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
