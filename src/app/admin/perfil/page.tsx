import { redirect } from "next/navigation";
import { getAdminSession, adminLogout } from "../actions";
import { getCurrentGestor, needsPasswordReset } from "../gestores/actions";
import { ProfileForm } from "./_components/ProfileForm";
import { Activity, LogOut, Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default async function ProfilePage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const currentGestor = await getCurrentGestor();
  
  if (!currentGestor) {
    // Usuário logado mas não está na tabela gestores
    redirect("/admin/empresas");
  }

  const forcePasswordChange = currentGestor.primeiro_acesso === true;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image
              src="/logos/logo_acutis_black.png"
              alt="Acutis"
              width={160}
              height={45}
              className="h-10 w-auto"
            />
            <div className="h-8 w-px bg-gray-200" />
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
              Meu Perfil
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!forcePasswordChange && (
              <Link href="/admin/empresas">
                <Button variant="outline" size="sm" className="text-xs">
                  <Building2 className="mr-2 h-3 w-3" />
                  Empresas
                </Button>
              </Link>
            )}
            <form action={adminLogout}>
              <button
                type="submit"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          {!forcePasswordChange && (
            <Link 
              href="/admin/empresas" 
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          )}
          <h2 className="text-2xl font-bold text-gray-900">
            {forcePasswordChange ? "Configure sua Senha" : "Meu Perfil"}
          </h2>
          <p className="text-gray-500">
            {forcePasswordChange 
              ? "Por segurança, defina uma nova senha pessoal"
              : "Gerencie suas informações e credenciais"
            }
          </p>
        </div>

        {/* Formulário */}
        <ProfileForm gestor={currentGestor} forcePasswordChange={forcePasswordChange} />
      </main>
    </div>
  );
}
