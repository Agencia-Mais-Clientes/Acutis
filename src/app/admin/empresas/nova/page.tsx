import { redirect } from "next/navigation";
import { getAdminSession, getManagers } from "../../actions";
import { CompanyForm } from "../_components/CompanyForm";
import { Activity, ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default async function NovaEmpresaPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const managers = await getManagers();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo Acutis Oficial */}
            <Link href="/admin/empresas" className="flex items-center">
              <Image
                src="/logos/logo_acutis_black.png"
                alt="Acutis"
                width={160}
                height={45}
                className="h-10 w-auto"
              />
            </Link>
            <div className="h-8 w-px bg-gray-200" />
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
              Painel Admin
            </span>
          </div>
          
          <Link href="/admin/empresas">
            <Button variant="outline" size="sm" className="text-xs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 md:p-8 shadow-xl mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-violet-200" />
              <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                Cadastro
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Nova Empresa
            </h2>
            <p className="text-white/70 text-sm mt-1">
              Preencha os dados para cadastrar uma nova empresa
            </p>
          </div>
        </div>
        
        <CompanyForm managers={managers} />
      </main>
    </div>
  );
}
