"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "./supabase";
import { ConfigEmpresa } from "./types";

const OWNER_COOKIE = "owner_id";
const ADMIN_VIEWING_COOKIE = "admin_viewing"; // Flag para indicar que admin está visualizando

export async function getOwnerId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(OWNER_COOKIE)?.value || null;
}

export async function setOwnerId(ownerId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(OWNER_COOKIE, ownerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });
}

export async function clearOwnerId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OWNER_COOKIE);
  cookieStore.delete(ADMIN_VIEWING_COOKIE);
}

export async function getEmpresa(ownerId: string): Promise<ConfigEmpresa | null> {
  const { data, error } = await supabaseAdmin
    .from("config_empresas")
    .select("*")
    .eq("owner", ownerId)
    .single();

  if (error || !data) return null;
  return data as ConfigEmpresa;
}

export async function validateOwner(ownerId: string): Promise<boolean> {
  const empresa = await getEmpresa(ownerId);
  return empresa !== null;
}

// ============================================
// FUNÇÕES ADMIN
// ============================================

/**
 * Verifica se há uma sessão de admin ativa (Supabase Auth)
 */
export async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only neste contexto
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}

/**
 * Verifica se admin está visualizando empresa de cliente
 */
export async function isAdminViewing(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_VIEWING_COOKIE)?.value === "true";
}

/**
 * Define qual empresa o admin quer visualizar
 */
export async function setOwnerIdAsAdmin(ownerId: string): Promise<{ success: boolean; error?: string }> {
  // Verifica se é admin
  const isAdmin = await isAdminSession();
  if (!isAdmin) {
    return { success: false, error: "Acesso não autorizado" };
  }

  // Verifica se empresa existe
  const empresa = await getEmpresa(ownerId);
  if (!empresa) {
    return { success: false, error: "Empresa não encontrada" };
  }

  const cookieStore = await cookies();
  
  // Seta o owner_id
  cookieStore.set(OWNER_COOKIE, ownerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 1 dia para admin
  });

  // Marca que é admin visualizando
  cookieStore.set(ADMIN_VIEWING_COOKIE, "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 1 dia
  });

  return { success: true };
}
