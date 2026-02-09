import { redirect } from "next/navigation";
import { getAdminSession, adminLogout } from "../../actions";
import { getCurrentGestor } from "../actions";
import { GestorForm } from "../_components/GestorForm";
import { Activity, LogOut, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function NovoGestorPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const currentGestor = await getCurrentGestor();
  if (!currentGestor || currentGestor.role !== "super_admin") {
    redirect("/dashboard");
  }

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
              Painel Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/admin/gestores"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Users className="h-4 w-4" />
              Gestores
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

      {/* Content */}
      <main className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Novo Gestor</h2>
          <p className="text-gray-500">Cadastre um novo gestor no sistema</p>
        </div>

        {/* Form */}
        <GestorForm />
      </main>
    </div>
  );
}
