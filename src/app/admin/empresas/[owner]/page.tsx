import { redirect } from "next/navigation";
import { getAdminSession, getCompany, getManagers } from "../../actions";
import { CompanyForm } from "../_components/CompanyForm";
import { Activity, ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface EditarEmpresaPageProps {
  params: Promise<{ owner: string }>;
}

export default async function EditarEmpresaPage({ params }: EditarEmpresaPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const { owner } = await params;
  const empresa = await getCompany(owner);

  if (!empresa) {
    redirect("/admin/empresas");
  }

  const managers = await getManagers();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
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
              <ArrowLeft className="mr-2 h-3 w-3" />
              Voltar
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 md:p-8 shadow-xl mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-violet-200" />
              <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                Editar Empresa
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {empresa.nome_empresa}
            </h2>
            <p className="text-white/70 text-sm mt-1">
              Atualize as informações e configurações da IA
            </p>
          </div>
        </div>

        {/* Form */}
        <CompanyForm empresa={empresa} managers={managers} />
      </main>
    </div>
  );
}
