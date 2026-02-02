"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
// import da lib que estava conflitando
import { getAllInstances } from "@/lib/uazapi";

// ============================================
// TIPOS
// ============================================

export interface Empresa {
  owner: string;
  nome_empresa: string;
  nicho: string | null;
  objetivo_conversao: string | null;
  instrucoes_ia: string | null;
  instance_token: string | null; // Token da instância UazAPI
  spreadsheet_id: string | null; // ID da planilha Google Sheets
  sheet_id: string | null; // ID da aba da planilha
  meta_ads_id: string | null; // ID da conta Meta Ads
  google_ads_id: string | null; // ID da conta Google Ads
  whatsapp_group_id: string | null; // ID do grupo do WhatsApp
  horario_funcionamento: Record<string, { inicio: string | null; fim: string | null; ativo: boolean }> | null; // Horário de funcionamento por dia
  timezone: string | null; // Timezone da empresa
  ativo: boolean;
  dia_relatorio: number | null; // 1=Segunda, ..., 7=Domingo
  gestor_responsavel: string | null; // Nome do gestor
  created_at: string;
}

export interface EmpresaComStatus extends Empresa {
  whatsapp_conectado: boolean;
  whatsapp_estado: string;
  whatsapp_profile_name: string | null;
  whatsapp_profile_pic: string | null;
  whatsapp_last_disconnect: string | null;
}

// ============================================
// AUTENTICAÇÃO ADMIN (SUPABASE AUTH)
// ============================================

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          try {
            cookies.map((c) => cookieStore.set(c.name, c.value, c.options));
          } catch (error) {
            // Ignora erro se estiver em um Server Component (read-only)
          }
        },
      },
    }
  );
}

export async function getAdminSession() {
  const supabase = await getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export async function adminLogin(email: string, password: string) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

export async function adminLogout() {
  const supabase = await getSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ============================================
// CRUD EMPRESAS
// ============================================

/**
 * Busca todas as empresas cadastradas
 */
export async function getCompanies(): Promise<Empresa[]> {
  const { data, error } = await supabaseAdmin
    .from("config_empresas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ADMIN] Erro ao buscar empresas:", error);
    return [];
  }

  return data as Empresa[];
}

/**
 * Busca empresas com status do WhatsApp
 */
/**
 * Busca empresas com status do WhatsApp otimizado
 * Usa getAllInstances para evitar N requisições
 */
export async function getCompaniesWithStatus(): Promise<EmpresaComStatus[]> {
  const empresas = await getCompanies();
  
  // Busca todas as instâncias do UazAPI de uma vez
  // Isso é muito mais rápido e confiável do que consultar uma por uma
  const uazapiInstances = await getAllInstances();
  
  // Cria um mapa para busca rápida: owner (telefone) -> dados completos
  const statusMap = new Map<string, { 
    connected: boolean; 
    state: string;
    profileName: string | null;
    profilePicUrl: string | null;
    lastDisconnect: string | null;
  }>();
  
  uazapiInstances.forEach(inst => {
    const info = {
      connected: inst.status === "connected" || inst.status === "open",
      state: inst.status,
      profileName: inst.profileName,
      profilePicUrl: null as string | null, // UazAPI v2 pode retornar isso em lugar diferente, ajustaremos se necessário
      lastDisconnect: (inst as any).lastDisconnect || null,
    };
    
    // Tenta pegar a foto se existir no payload bruto
    if ((inst as any).profilePicUrl) {
      info.profilePicUrl = (inst as any).profilePicUrl;
    }

    if (inst.phone) statusMap.set(inst.phone, info);
    if (inst.token) statusMap.set(inst.token, info); // Usa o mesmo mapa para token também simplificando
  });

  return empresas.map((empresa) => {
    // Tenta status pelo telefone (owner)
    let status = statusMap.get(empresa.owner);
    
    // Se não achou pelo telefone, tenta pelo token
    if (!status && empresa.instance_token) {
      status = statusMap.get(empresa.instance_token);
    }

    return {
      ...empresa,
      whatsapp_conectado: status?.connected ?? false,
      whatsapp_estado: status?.state ?? "UNKNOWN",
      whatsapp_profile_name: status?.profileName ?? null,
      whatsapp_profile_pic: status?.profilePicUrl ?? null,
      whatsapp_last_disconnect: status?.lastDisconnect ?? null,
    };
  });
}

/**
 * Busca uma empresa pelo owner
 */
export async function getCompany(owner: string): Promise<Empresa | null> {
  const { data, error } = await supabaseAdmin
    .from("config_empresas")
    .select("*")
    .eq("owner", owner)
    .single();

  if (error) {
    console.error("[ADMIN] Erro ao buscar empresa:", error);
    return null;
  }

  return data as Empresa;
}

/**
 * Cria ou atualiza uma empresa
 */
export async function saveCompany(empresa: Partial<Empresa>): Promise<{ success: boolean; error?: string }> {
  if (!empresa.owner || !empresa.nome_empresa) {
    return { success: false, error: "Owner e nome da empresa são obrigatórios" };
  }

  // Verifica se já existe
  const { data: existing } = await supabaseAdmin
    .from("config_empresas")
    .select("owner")
    .eq("owner", empresa.owner)
    .single();

  if (existing) {
    // Atualiza
    const { error } = await supabaseAdmin
      .from("config_empresas")
      .update({
        nome_empresa: empresa.nome_empresa,
        nicho: empresa.nicho,
        objetivo_conversao: empresa.objetivo_conversao,
        instrucoes_ia: empresa.instrucoes_ia,
        instance_token: empresa.instance_token,
        spreadsheet_id: empresa.spreadsheet_id,
        sheet_id: empresa.sheet_id,
        meta_ads_id: empresa.meta_ads_id,
        google_ads_id: empresa.google_ads_id,
        whatsapp_group_id: empresa.whatsapp_group_id,
        horario_funcionamento: empresa.horario_funcionamento,
        timezone: empresa.timezone,
        ativo: empresa.ativo ?? true,
        dia_relatorio: empresa.dia_relatorio ?? null,
        gestor_responsavel: empresa.gestor_responsavel,
      })
      .eq("owner", empresa.owner);

    if (error) {
      console.error("[ADMIN] Erro ao atualizar empresa:", error);
      return { success: false, error: error.message };
    }
  } else {
    // Cria
    const { error } = await supabaseAdmin.from("config_empresas").insert({
      owner: empresa.owner,
      nome_empresa: empresa.nome_empresa,
      nicho: empresa.nicho,
      objetivo_conversao: empresa.objetivo_conversao,
      instrucoes_ia: empresa.instrucoes_ia,
      instance_token: empresa.instance_token,
      spreadsheet_id: empresa.spreadsheet_id,
      sheet_id: empresa.sheet_id,
      meta_ads_id: empresa.meta_ads_id,
      google_ads_id: empresa.google_ads_id,
      whatsapp_group_id: empresa.whatsapp_group_id,
      horario_funcionamento: empresa.horario_funcionamento,
      timezone: empresa.timezone,
      ativo: empresa.ativo ?? true,
      dia_relatorio: empresa.dia_relatorio ?? null,
      gestor_responsavel: empresa.gestor_responsavel,
    });

    if (error) {
      console.error("[ADMIN] Erro ao criar empresa:", error);
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

/**
 * Alterna o status ativo/inativo de uma empresa
 */
export async function toggleCompanyStatus(owner: string): Promise<{ success: boolean }> {
  // Busca status atual
  const { data: empresa } = await supabaseAdmin
    .from("config_empresas")
    .select("ativo")
    .eq("owner", owner)
    .single();

  if (!empresa) {
    return { success: false };
  }

  // Inverte o status
  const { error } = await supabaseAdmin
    .from("config_empresas")
    .update({ ativo: !empresa.ativo })
    .eq("owner", owner);

  if (error) {
    console.error("[ADMIN] Erro ao alterar status:", error);
    return { success: false };
  }

  return { success: true };
}

/**
 * Deleta uma empresa
 */
export async function deleteCompany(owner: string): Promise<{ success: boolean }> {
  const { error } = await supabaseAdmin
    .from("config_empresas")
    .delete()
    .eq("owner", owner);

  if (error) {
    console.error("[ADMIN] Erro ao deletar empresa:", error);
    return { success: false };
  }

  return { success: true };
}

/**
 * Sincroniza tokens das instâncias UazAPI com o banco
 * Atualiza o instance_token das empresas que têm o telefone correspondente
 */
export async function syncInstanceTokens(): Promise<{ updated: number; notFound: string[] }> {
  // Busca todas instâncias do UazAPI
  const instances = await getAllInstances();
  
  if (instances.length === 0) {
    console.warn("[ADMIN] Nenhuma instância encontrada no UazAPI");
    return { updated: 0, notFound: [] };
  }

  console.log(`[ADMIN] Encontradas ${instances.length} instâncias no UazAPI`);

  let updated = 0;
  const notFound: string[] = [];

  for (const inst of instances) {
    if (!inst.phone || !inst.token) continue;

    // Tenta encontrar empresa com esse telefone (owner)
    const { data: empresa, error } = await supabaseAdmin
      .from("config_empresas")
      .select("owner, instance_token")
      .eq("owner", inst.phone)
      .single();

    if (error || !empresa) {
      // Telefone não cadastrado como empresa
      notFound.push(inst.phone);
      continue;
    }

    // Atualiza token se diferente
    if (empresa.instance_token !== inst.token) {
      await supabaseAdmin
        .from("config_empresas")
        .update({ instance_token: inst.token })
        .eq("owner", inst.phone);
      
      console.log(`[ADMIN] Token atualizado para ${inst.phone}`);
      updated++;
    }
  }

  return { updated, notFound };
}


/**
 * Seleciona a primeira empresa ativa automaticamente (para admin)
 */
export async function selectFirstActiveCompany(): Promise<{ success: boolean; error?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: "Não autorizado" };
  }

  const empresas = await getCompanies();
  const empresaAtiva = empresas.find(e => e.ativo);

  if (!empresaAtiva) {
    return { success: false, error: "Nenhuma empresa ativa encontrada" };
  }

  const { setOwnerIdAsAdmin } = await import("@/lib/auth");
  return await setOwnerIdAsAdmin(empresaAtiva.owner);
}

/**
 * Busca lista de gestores ativos da tabela gestores
 */
export async function getManagers(): Promise<{ id: string; email: string; name?: string }[]> {
  const { data, error } = await supabaseAdmin
    .from("gestores")
    .select("id, email, nome")
    .eq("ativo", true)
    .order("nome");

  if (error) {
    console.error("[ADMIN] Erro ao buscar gestores:", error);
    return [];
  }

  return data.map(g => ({
    id: g.id,
    email: g.email,
    name: g.nome
  }));
}


