import { redirect } from "next/navigation";
import { getAdminSession, getCompaniesWithStatus, adminLogout } from "../actions";
import { CompanyList } from "./_components/CompanyList";
import { SyncTokensButton } from "./_components/SyncTokensButton";
import { Activity, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminEmpresasPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const empresas = await getCompaniesWithStatus();

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Navbar */}
      <nav className="bg-[#0b0d11] border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/20">
              <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight uppercase">
                Acutis
              </h1>
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                Painel Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="text-xs border-gray-700 text-gray-400">
                Dashboard
              </Button>
            </Link>
            <form action={adminLogout}>
              <button
                type="submit"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4 text-gray-500 hover:text-white" />
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Empresas Cadastradas</h2>
            <p className="text-sm text-gray-500">
              Gerencie as empresas e suas configurações de IA
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SyncTokensButton />
            <Link href="/admin/empresas/nova">
              <Button className="bg-green-600 hover:bg-green-700">
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
