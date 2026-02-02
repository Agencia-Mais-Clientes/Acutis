import { redirect } from "next/navigation";
import { getAdminSession, adminLogout } from "../actions";
import { getGestores, getCurrentGestor, seedCurrentUserAsSuperAdmin } from "./actions";
import { GestorList } from "./_components/GestorList";
import { SeedSuperAdminButton } from "./_components/SeedSuperAdminButton";
import { Activity, LogOut, Plus, Users, Building2, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default async function AdminGestoresPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  // Verifica se o usuário já está na tabela gestores
  const currentGestor = await getCurrentGestor();
  
  // Se está na tabela mas NÃO é super_admin → redireciona (gestor normal não acessa)
  if (currentGestor && currentGestor.role !== "super_admin") {
    redirect("/dashboard");
  }
  
  // Se NÃO está na tabela, verifica se já existem gestores cadastrados
  if (!currentGestor) {
    const gestores = await getGestores();
    
    // Se já existem gestores, significa que não é o primeiro setup
    // e este usuário não está registrado → não pode acessar
    if (gestores.length > 0) {
      redirect("/dashboard");
    }
    
    // É o PRIMEIRO acesso do sistema, ainda sem gestores → mostra tela de setup
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-6 h-16 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Image
                src="/logos/simbolo-mais-clientes.png"
                alt="Mais Clientes"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-sm font-black text-gray-900 tracking-tight uppercase">
                    Acutis
                  </h1>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                    Painel Admin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Setup Card */}
        <main className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Configuração Inicial
            </h2>
            <p className="text-gray-500 mb-6">
              Você é o primeiro administrador. Registre-se como Super Admin para começar.
            </p>
            <SeedSuperAdminButton />
          </div>
        </main>
      </div>
    );
  }

  // Chegou aqui = é super_admin

  const gestores = await getGestores();
  const totalAtivos = gestores.filter(g => g.ativo).length;
  const totalSuperAdmin = gestores.filter(g => g.role === "super_admin").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Logo Mais Clientes */}
            <Image
              src="/logos/simbolo-mais-clientes.png"
              alt="Mais Clientes"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <div className="h-8 w-px bg-gray-200" />
            {/* Logo Acutis */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-sm font-black text-gray-900 tracking-tight uppercase">
                  Acutis
                </h1>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                  Painel Admin
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/empresas">
              <Button variant="outline" size="sm" className="text-xs">
                <Building2 className="mr-2 h-3 w-3" />
                Empresas
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="text-xs">
                Dashboard
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

      {/* Content */}
      <main className="container mx-auto p-6">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 md:p-8 shadow-xl mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-emerald-200" />
                <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                  Gestão de Usuários
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Gestores do Sistema
              </h2>
              <p className="text-white/70 text-sm mt-1">
                Gerencie os usuários e suas permissões
              </p>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-white">{gestores.length}</p>
                <p className="text-[10px] text-white/70 uppercase font-medium">Total</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-emerald-200">{totalAtivos}</p>
                <p className="text-[10px] text-white/70 uppercase font-medium">Ativos</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-cyan-200">{totalSuperAdmin}</p>
                <p className="text-[10px] text-white/70 uppercase font-medium">Admins</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>{gestores.length} gestor{gestores.length !== 1 ? 'es' : ''} cadastrado{gestores.length !== 1 ? 's' : ''}</span>
          </div>
          <Link href="/admin/gestores/novo">
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/20">
              <Plus className="mr-2 h-4 w-4" />
              Novo Gestor
            </Button>
          </Link>
        </div>

        {/* Lista de Gestores */}
        <GestorList gestores={gestores} />
      </main>
    </div>
  );
}
