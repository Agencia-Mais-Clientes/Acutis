import { redirect } from "next/navigation";
import { getAdminSession, getCompany } from "../../actions";
import { CompanyForm } from "../_components/CompanyForm";
import { Activity } from "lucide-react";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Navbar */}
      <nav className="bg-[#0b0d11] border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center gap-3">
          <Link href="/admin/empresas" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/20">
              <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight uppercase">
                Acutis
              </h1>
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                Editar Empresa
              </span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          Editar: {empresa.nome_empresa}
        </h2>
        <CompanyForm empresa={empresa} />
      </main>
    </div>
  );
}
