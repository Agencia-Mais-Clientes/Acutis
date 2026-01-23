import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const ownerId = request.cookies.get("owner_id")?.value;
  const pathname = request.nextUrl.pathname;

  // Verifica se há sessão admin (Supabase Auth usa cookies sb-*)
  const hasSupabaseAuth = Array.from(request.cookies.getAll()).some(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token")
  );

  // Rotas protegidas
  const protectedRoutes = ["/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Se está tentando acessar rota protegida sem autenticação
  // Permite se tem owner_id OU se tem sessão admin (Supabase Auth)
  if (isProtectedRoute && !ownerId && !hasSupabaseAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Se está autenticado e tentando acessar login
  if (pathname === "/login" && ownerId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
