import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase";

/**
 * Resultado da validação de sessão
 */
export interface SessionValidation {
  isValid: boolean;
  ownerId: string | null;
  isAdmin: boolean;
  error?: string;
}

/**
 * Valida a sessão do usuário e retorna o ownerId autorizado.
 * 
 * Cenários:
 * 1. Admin autenticado (Supabase Auth) com empresa selecionada → retorna ownerId do cookie
 * 2. Cliente com owner_id no cookie → retorna ownerId do cookie
 * 3. Sem autenticação → retorna inválido
 * 
 * @param requestedOwnerId - ID solicitado pelo cliente (para verificação de permissão)
 */
export async function validateSession(requestedOwnerId?: string): Promise<SessionValidation> {
  const cookieStore = await cookies();
  
  // Verifica cookies de autenticação
  const ownerIdCookie = cookieStore.get("owner_id")?.value;
  const adminCompanyCookie = cookieStore.get("admin_selected_company")?.value;
  
  // Detecta sessão admin (Supabase Auth)
  const hasSupabaseAuth = cookieStore.getAll().some(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token")
  );

  // Cenário 1: Admin com empresa selecionada
  if (hasSupabaseAuth && adminCompanyCookie) {
    // Admin pode acessar qualquer empresa que ele selecionou
    // Validamos se o requestedOwnerId bate com o que ele selecionou (ou é o mesmo)
    const authorizedOwnerId = adminCompanyCookie;
    
    if (requestedOwnerId && requestedOwnerId !== authorizedOwnerId) {
      return {
        isValid: false,
        ownerId: null,
        isAdmin: true,
        error: "Acesso negado: ownerId não corresponde à empresa selecionada",
      };
    }
    
    return {
      isValid: true,
      ownerId: authorizedOwnerId,
      isAdmin: true,
    };
  }

  // Cenário 2: Cliente comum (owner_id direto no cookie)
  if (ownerIdCookie) {
    // Cliente só pode acessar seus próprios dados
    if (requestedOwnerId && requestedOwnerId !== ownerIdCookie) {
      return {
        isValid: false,
        ownerId: null,
        isAdmin: false,
        error: "Acesso negado: você só pode acessar dados da sua própria empresa",
      };
    }
    
    return {
      isValid: true,
      ownerId: ownerIdCookie,
      isAdmin: false,
    };
  }

  // Cenário 3: Sem autenticação válida
  return {
    isValid: false,
    ownerId: null,
    isAdmin: false,
    error: "Sessão inválida ou expirada",
  };
}

/**
 * Helper para Server Actions: valida sessão e retorna ownerId ou lança erro
 * Uso: const ownerId = await requireAuth();
 */
export async function requireAuth(requestedOwnerId?: string): Promise<string> {
  const session = await validateSession(requestedOwnerId);
  
  if (!session.isValid || !session.ownerId) {
    throw new Error(session.error || "Não autorizado");
  }
  
  return session.ownerId;
}

/**
 * Verifica se o usuário atual é um admin autenticado
 */
export async function isAdminSession(): Promise<boolean> {
  const session = await validateSession();
  return session.isAdmin && session.isValid;
}
