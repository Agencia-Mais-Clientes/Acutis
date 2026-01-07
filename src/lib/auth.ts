"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase";
import { ConfigEmpresa } from "./types";

const OWNER_COOKIE = "owner_id";

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
