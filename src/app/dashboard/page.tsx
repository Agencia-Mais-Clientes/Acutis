import { redirect } from "next/navigation";
import { getOwnerId, getEmpresa, clearOwnerId } from "@/lib/auth";
import { getAnalises, getKPIs, getGargalos, getTopObjecoes } from "./actions";
import { KPICards } from "./_components/KPICards";
import { MonitorGargalos } from "./_components/MonitorGargalos";
import { TopObjecoes } from "./_components/TopObjecoes";
import { TabelaAuditoria } from "./_components/TabelaAuditoria";
import { AssistenteIA } from "./_components/AssistenteIA";
import { CentralAlertas } from "./_components/CentralAlertas";
import { analisarSaudeNegocio } from "./actions-proactive";
import { LogOut, Activity } from "lucide-react";

export default async function DashboardPage() {
  const ownerId = await getOwnerId();

  if (!ownerId) {
    redirect("/login");
  }

  const empresa = await getEmpresa(ownerId);

  if (!empresa) {
    redirect("/login");
  }

  // Busca dados em paralelo
  const [analises, kpis, gargalos, objecoes, alerts] = await Promise.all([
    getAnalises(ownerId),
    getKPIs(ownerId),
    getGargalos(ownerId),
    getTopObjecoes(ownerId),
    analisarSaudeNegocio(ownerId),
  ]);

  async function handleLogout() {
    "use server";
    await clearOwnerId();
    redirect("/login");
  }

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
              <h1 className="text-sm font-black text-white tracking-tight uppercase">Acutis</h1>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                  Live Supervisor
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-white font-bold uppercase">
              {empresa.nome_empresa}
            </div>
            <form action={handleLogout}>
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

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Central de Alertas (Painel do Presidente) */}
        <CentralAlertas alerts={alerts} />

        {/* KPIs */}
        <KPICards kpis={kpis} />

        {/* Grid com Gargalos e Objeções */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonitorGargalos gargalos={gargalos} totalLeads={kpis.totalLeads} />
          <TopObjecoes objecoes={objecoes} />
        </div>

        {/* Tabela de Auditoria */}
        <div className="bg-[#0b0d11] rounded-xl border border-gray-800 overflow-hidden">
          <TabelaAuditoria analises={analises} />
        </div>
      </main>

      {/* Assistente IA */}
      <AssistenteIA ownerId={ownerId} nomeEmpresa={empresa.nome_empresa} />
    </div>
  );
}
