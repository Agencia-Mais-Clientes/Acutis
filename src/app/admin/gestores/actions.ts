"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "../actions";
import { revalidatePath } from "next/cache";

// ============================================
// TIPOS
// ============================================

export type UserRole = "super_admin" | "gestor";

export interface Gestor {
  id: string;
  user_id: string | null;
  nome: string;
  email: string;
  telefone: string | null;
  role: UserRole;
  ativo: boolean;
  primeiro_acesso: boolean;
  created_at: string;
  updated_at: string;
}

export interface GestorComEmpresas extends Gestor {
  empresas: { owner: string; nome_empresa: string }[];
}

// ============================================
// AUTENTICAÇÃO E AUTORIZAÇÃO
// ============================================

/**
 * Busca o gestor logado atual
 */
export async function getCurrentGestor(): Promise<Gestor | null> {
  const session = await getAdminSession();
  if (!session?.user?.id) return null;

  const { data, error } = await supabaseAdmin
    .from("gestores")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  if (error) {
    console.error("[GESTORES] Erro ao buscar gestor atual:", error);
    return null;
  }

  return data as Gestor;
}

/**
 * Verifica se o usuário atual é super_admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const gestor = await getCurrentGestor();
  return gestor?.role === "super_admin";
}

/**
 * Middleware: Exige que o usuário seja super_admin
 */
export async function requireSuperAdmin(): Promise<Gestor> {
  const gestor = await getCurrentGestor();
  
  if (!gestor || gestor.role !== "super_admin") {
    throw new Error("Acesso negado. Apenas Super Admin pode realizar esta ação.");
  }

  return gestor;
}

// ============================================
// CRUD GESTORES
// ============================================

/**
 * Lista todos os gestores (apenas super_admin)
 */
export async function getGestores(): Promise<GestorComEmpresas[]> {
  // Busca gestores
  const { data: gestores, error } = await supabaseAdmin
    .from("gestores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GESTORES] Erro ao buscar gestores:", error);
    return [];
  }

  // Busca vínculos com empresas
  const { data: vinculos } = await supabaseAdmin
    .from("gestor_empresa")
    .select(`
      gestor_id,
      empresa_owner,
      config_empresas!inner(owner, nome_empresa)
    `);

  // Monta mapa de empresas por gestor
  const empresasMap = new Map<string, { owner: string; nome_empresa: string }[]>();
  
  if (vinculos) {
    for (const v of vinculos) {
      const gestorId = v.gestor_id;
      const empresa = v.config_empresas as unknown as { owner: string; nome_empresa: string };
      
      if (!empresasMap.has(gestorId)) {
        empresasMap.set(gestorId, []);
      }
      empresasMap.get(gestorId)!.push(empresa);
    }
  }

  return (gestores as Gestor[]).map((g) => ({
    ...g,
    empresas: empresasMap.get(g.id) || [],
  }));
}

/**
 * Busca um gestor pelo ID
 */
export async function getGestor(id: string): Promise<GestorComEmpresas | null> {
  const { data: gestor, error } = await supabaseAdmin
    .from("gestores")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[GESTORES] Erro ao buscar gestor:", error);
    return null;
  }

  // Busca empresas vinculadas
  const { data: vinculos } = await supabaseAdmin
    .from("gestor_empresa")
    .select(`
      empresa_owner,
      config_empresas!inner(owner, nome_empresa)
    `)
    .eq("gestor_id", id);

  const empresas = (vinculos || []).map((v) => {
    const empresa = v.config_empresas as unknown as { owner: string; nome_empresa: string };
    return empresa;
  });

  return {
    ...(gestor as Gestor),
    empresas,
  };
}

/**
 * Cria um novo gestor
 * Cria usuário no Supabase Auth e registra na tabela gestores
 */
export async function createGestor(data: {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
  role: UserRole;
  empresas?: string[]; // array de owners
}): Promise<{ success: boolean; error?: string; gestor?: Gestor }> {
  await requireSuperAdmin();

  // 1. Cria usuário no Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.senha,
    email_confirm: true, // Confirma email automaticamente
    user_metadata: {
      name: data.nome,
      role: data.role,
    },
  });

  if (authError) {
    console.error("[GESTORES] Erro ao criar usuário Auth:", authError);
    return { success: false, error: authError.message };
  }

  // 2. Cria registro na tabela gestores
  const { data: gestor, error: gestorError } = await supabaseAdmin
    .from("gestores")
    .insert({
      user_id: authData.user.id,
      nome: data.nome,
      email: data.email,
      telefone: data.telefone || null,
      role: data.role,
      ativo: true,
    })
    .select()
    .single();

  if (gestorError) {
    console.error("[GESTORES] Erro ao criar gestor:", gestorError);
    // Rollback: remove usuário do Auth
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: gestorError.message };
  }

  // 3. Vincula empresas (se houver)
  if (data.empresas && data.empresas.length > 0) {
    const vinculos = data.empresas.map((owner) => ({
      gestor_id: gestor.id,
      empresa_owner: owner,
    }));

    const { error: vinculoError } = await supabaseAdmin
      .from("gestor_empresa")
      .insert(vinculos);

    if (vinculoError) {
      console.error("[GESTORES] Erro ao vincular empresas:", vinculoError);
    }
  }

  revalidatePath("/admin/gestores");
  return { success: true, gestor: gestor as Gestor };
}

/**
 * Atualiza um gestor existente
 */
export async function updateGestor(
  id: string,
  data: {
    nome?: string;
    telefone?: string | null;
    role?: UserRole;
    ativo?: boolean;
    empresas?: string[]; // array de owners (substitui todos os vínculos)
  }
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();

  // 1. Atualiza dados do gestor
  const updateData: Record<string, unknown> = {};
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.telefone !== undefined) updateData.telefone = data.telefone;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.ativo !== undefined) updateData.ativo = data.ativo;

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabaseAdmin
      .from("gestores")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("[GESTORES] Erro ao atualizar gestor:", error);
      return { success: false, error: error.message };
    }
  }

  // 2. Atualiza vínculos de empresas (se especificado)
  if (data.empresas !== undefined) {
    // Remove vínculos antigos
    await supabaseAdmin
      .from("gestor_empresa")
      .delete()
      .eq("gestor_id", id);

    // Adiciona novos vínculos
    if (data.empresas.length > 0) {
      const vinculos = data.empresas.map((owner) => ({
        gestor_id: id,
        empresa_owner: owner,
      }));

      const { error: vinculoError } = await supabaseAdmin
        .from("gestor_empresa")
        .insert(vinculos);

      if (vinculoError) {
        console.error("[GESTORES] Erro ao vincular empresas:", vinculoError);
      }
    }
  }

  revalidatePath("/admin/gestores");
  return { success: true };
}

/**
 * Deleta um gestor (remove do Auth e da tabela)
 */
export async function deleteGestor(id: string): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();

  // 1. Busca o gestor para pegar o user_id
  const { data: gestor, error: fetchError } = await supabaseAdmin
    .from("gestores")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !gestor) {
    return { success: false, error: "Gestor não encontrado" };
  }

  // 2. Remove do Auth (cascade remove da tabela gestores via FK)
  if (gestor.user_id) {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(gestor.user_id);
    if (authError) {
      console.error("[GESTORES] Erro ao deletar usuário Auth:", authError);
      return { success: false, error: authError.message };
    }
  } else {
    // Se não tem user_id, deleta direto da tabela
    const { error } = await supabaseAdmin
      .from("gestores")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/admin/gestores");
  return { success: true };
}

/**
 * Alterna status ativo/inativo de um gestor
 */
export async function toggleGestorStatus(id: string): Promise<{ success: boolean }> {
  await requireSuperAdmin();

  const { data: gestor } = await supabaseAdmin
    .from("gestores")
    .select("ativo")
    .eq("id", id)
    .single();

  if (!gestor) return { success: false };

  const { error } = await supabaseAdmin
    .from("gestores")
    .update({ ativo: !gestor.ativo })
    .eq("id", id);

  if (error) {
    console.error("[GESTORES] Erro ao alterar status:", error);
    return { success: false };
  }

  revalidatePath("/admin/gestores");
  return { success: true };
}

// ============================================
// SEED INICIAL
// ============================================

/**
 * Registra o usuário atual como super_admin (usar uma vez para setup inicial)
 */
export async function seedCurrentUserAsSuperAdmin(): Promise<{ success: boolean; error?: string }> {
  const session = await getAdminSession();
  if (!session?.user) {
    return { success: false, error: "Não autenticado" };
  }

  // Verifica se já existe
  const { data: existing } = await supabaseAdmin
    .from("gestores")
    .select("id")
    .eq("user_id", session.user.id)
    .single();

  if (existing) {
    return { success: false, error: "Usuário já está registrado como gestor" };
  }

  // Cria registro
  const { error } = await supabaseAdmin.from("gestores").insert({
    user_id: session.user.id,
    nome: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Admin",
    email: session.user.email!,
    role: "super_admin",
    ativo: true,
  });

  if (error) {
    console.error("[GESTORES] Erro ao criar super_admin:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/gestores");
  return { success: true };
}

// ============================================
// PERFIL DO USUÁRIO LOGADO
// ============================================

/**
 * Atualiza o perfil do usuário logado (nome e telefone)
 */
export async function updateMyProfile(data: {
  nome: string;
  telefone?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const gestor = await getCurrentGestor();
  if (!gestor) {
    return { success: false, error: "Usuário não encontrado" };
  }

  const { error } = await supabaseAdmin
    .from("gestores")
    .update({
      nome: data.nome,
      telefone: data.telefone || null,
    })
    .eq("id", gestor.id);

  if (error) {
    console.error("[GESTORES] Erro ao atualizar perfil:", error);
    return { success: false, error: error.message };
  }

  // Também atualiza no Auth metadata
  if (gestor.user_id) {
    await supabaseAdmin.auth.admin.updateUserById(gestor.user_id, {
      user_metadata: { name: data.nome },
    });
  }

  revalidatePath("/admin/perfil");
  return { success: true };
}

/**
 * Altera a senha do usuário logado
 */
export async function changeMyPassword(data: {
  novaSenha: string;
  confirmarSenha: string;
}): Promise<{ success: boolean; error?: string }> {
  if (data.novaSenha !== data.confirmarSenha) {
    return { success: false, error: "As senhas não coincidem" };
  }

  if (data.novaSenha.length < 6) {
    return { success: false, error: "A senha deve ter pelo menos 6 caracteres" };
  }

  const gestor = await getCurrentGestor();
  if (!gestor || !gestor.user_id) {
    return { success: false, error: "Usuário não encontrado" };
  }

  // Atualiza senha no Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    gestor.user_id,
    { password: data.novaSenha }
  );

  if (authError) {
    console.error("[GESTORES] Erro ao alterar senha:", authError);
    return { success: false, error: authError.message };
  }

  // Marca que não é mais primeiro acesso
  await supabaseAdmin
    .from("gestores")
    .update({ primeiro_acesso: false })
    .eq("id", gestor.id);

  revalidatePath("/admin/perfil");
  return { success: true };
}

/**
 * Verifica se o usuário logado precisa redefinir a senha (primeiro acesso)
 */
export async function needsPasswordReset(): Promise<boolean> {
  const gestor = await getCurrentGestor();
  return gestor?.primeiro_acesso === true;
}
