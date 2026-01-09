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
import { LogOut, Sparkles, AlertTriangle } from "lucide-react";
import { FadeIn, SlideUp } from "@/components/ui/motion";

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
    <div className="p-4 md:p-8 space-y-6">
       {/* Premium Header with Gradient */}
       <FadeIn duration={0.6}>
         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 md:p-8 shadow-xl">
           {/* Background decoration */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
           
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
               <div className="flex items-center gap-2 mb-2">
                 <Sparkles className="h-5 w-5 text-yellow-300" />
                 <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                   Dashboard Operacional
                 </span>
               </div>
               <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                 Olá, {empresa.nome_empresa}! 👋
               </h1>
               <p className="text-white/70 text-sm mt-1">
                 Aqui está o resumo do seu desempenho
               </p>
             </div>
             <div className="flex items-center gap-3">
                {/* Alert indicator in header */}
                {alerts.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg animate-pulse">
                    <AlertTriangle className="h-4 w-4 text-red-300" />
                    <span className="text-sm font-medium text-red-100">{alerts.length} Alerta{alerts.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium text-white">Online</span>
                </div>
                <form action={handleLogout}>
                 <button
                   type="submit"
                   className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                 >
                   <LogOut className="h-4 w-4" />
                   Sair
                 </button>
               </form>
             </div>
           </div>
         </div>
       </FadeIn>

      {/* Main Content */}
      <div className="space-y-6">
        {/* KPIs - Main visual focus */}
        <SlideUp delay={0.1}>
          <KPICards kpis={kpis} />
        </SlideUp>

        {/* Central de Alertas - Only if alerts exist */}
        {alerts.length > 0 && (
          <SlideUp delay={0.15}>
            <CentralAlertas alerts={alerts} />
          </SlideUp>
        )}

        {/* Grid com Gargalos e Objeções */}
        <SlideUp delay={0.2}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonitorGargalos gargalos={gargalos} totalLeads={kpis.totalLeads} />
            <TopObjecoes objecoes={objecoes} />
          </div>
        </SlideUp>

        {/* Tabela de Auditoria */}
        <SlideUp delay={0.3}>
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <TabelaAuditoria analises={analises} />
          </div>
        </SlideUp>
      </div>

      {/* Assistente IA */}
      <AssistenteIA ownerId={ownerId} nomeEmpresa={empresa.nome_empresa} />
    </div>
  );
}
