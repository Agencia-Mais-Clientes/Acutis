import { redirect } from "next/navigation";
import { getAdminSession, getCompaniesWithStatus, adminLogout } from "../actions";
import { getCurrentGestor, needsPasswordReset } from "../gestores/actions";
import { CompanyList } from "./_components/CompanyList";
import { SyncTokensButton } from "./_components/SyncTokensButton";
import { AutoSelector } from "./_components/AutoSelector";
import { Activity, LogOut, Plus, Building2, Sparkles, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default async function AdminEmpresasPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  // Verifica se precisa redefinir senha (primeiro acesso)
  const precisaTrocarSenha = await needsPasswordReset();
  if (precisaTrocarSenha) {
    redirect("/admin/perfil");
  }

  const empresas = await getCompaniesWithStatus();
  const currentGestor = await getCurrentGestor();
  const isSuperAdmin = currentGestor?.role === "super_admin";
  
  const totalOnline = empresas.filter(e => e.whatsapp_conectado).length;
  const totalAtivo = empresas.filter(e => e.ativo).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Logo Acutis Oficial */}
            <Image
              src="/logos/logo_acutis_black.png"
              alt="Acutis"
              width={160}
              height={45}
              className="h-10 w-auto"
            />
            <div className="h-8 w-px bg-gray-200" />
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
              Painel Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <Link href="/admin/gestores">
                <Button variant="outline" size="sm" className="text-xs">
                  <Users className="mr-2 h-3 w-3" />
                  Gestores
                </Button>
              </Link>
            )}
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="text-xs">
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/perfil">
              <Button variant="ghost" size="sm" className="text-xs">
                <User className="mr-2 h-3 w-3" />
                Perfil
              </Button>
            </Link>
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

      {/* Auto Selector Logic */}
      <AutoSelector />

      {/* Content */}
      <main className="container mx-auto p-6">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 md:p-8 shadow-xl mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-violet-200" />
                <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                  Gestão de Empresas
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Empresas Cadastradas
              </h2>
              <p className="text-white/70 text-sm mt-1">
                Gerencie as empresas e suas configurações de IA
              </p>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-white">{empresas.length}</p>
                <p className="text-[10px] text-white/70 uppercase font-medium">Total</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-emerald-300">{totalOnline}</p>
                <p className="text-[10px] text-white/70 uppercase font-medium">Online</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-violet-200">{totalAtivo}</p>
                <p className="text-[10px] text-white/70 uppercase font-medium">Ativos</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span>{empresas.length} empresa{empresas.length !== 1 ? 's' : ''} encontrada{empresas.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-3">
            <SyncTokensButton />
            <Link href="/admin/empresas/nova">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20">
                <Plus className="mr-2 h-4 w-4" />
                Nova Empresa
              </Button>
            </Link>
          </div>
        </div>

        {/* Lista de Empresas */}
        <CompanyList empresas={empresas} />
      </main>
    </div>
  );
}
