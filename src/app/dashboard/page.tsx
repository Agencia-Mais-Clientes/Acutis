import { redirect } from "next/navigation";
import { getOwnerId, getEmpresa, clearOwnerId, isAdminSession, isAdminViewing, setOwnerIdAsAdmin } from "@/lib/auth";
import { getKPIs, getGargalos, getTopObjecoes } from "./actions";
import { KPICards } from "./_components/KPICards";
import { MonitorGargalos } from "./_components/MonitorGargalos";
import { TopObjecoes } from "./_components/TopObjecoes";
import { AssistenteIA } from "./_components/AssistenteIA";
import { CentralAlertas } from "./_components/CentralAlertas";
import { CompanySelector } from "./_components/CompanySelector";
import { analisarSaudeNegocio } from "./actions-proactive";
import { getCompanies } from "@/app/admin/actions";
import { LogOut, Sparkles, AlertTriangle } from "lucide-react";
import { FadeIn, SlideUp } from "@/components/ui/motion";

export default async function DashboardPage() {
  const ownerId = await getOwnerId();
  const isAdmin = await isAdminSession();
  const adminViewing = await isAdminViewing();

  // Se não tem owner e não é admin, redireciona para login
  if (!ownerId && !isAdmin) {
    redirect("/login");
  }

  // Se é admin sem owner selecionado, busca a primeira empresa ativa
  let effectiveOwnerId = ownerId;
  if (!ownerId && isAdmin) {
    const empresas = await getCompanies();
    const empresaAtiva = empresas.find(e => e.ativo);
    if (empresaAtiva) {
      await setOwnerIdAsAdmin(empresaAtiva.owner);
      effectiveOwnerId = empresaAtiva.owner;
    } else {
      redirect("/admin/empresas");
    }
  }

  if (!effectiveOwnerId) {
    redirect("/login");
  }

  const empresa = await getEmpresa(effectiveOwnerId);

  if (!empresa) {
    redirect("/login");
  }

  // Busca lista de empresas se for admin
  const empresas = isAdmin ? await getCompanies() : [];

  // Busca dados em paralelo
  const [kpis, gargalos, objecoes, alerts] = await Promise.all([
    getKPIs(effectiveOwnerId),
    getGargalos(effectiveOwnerId),
    getTopObjecoes(effectiveOwnerId),
    analisarSaudeNegocio(effectiveOwnerId),
  ]);

  async function handleLogout() {
    "use server";
    await clearOwnerId();
    // Se era admin, redireciona para login admin
    const wasAdmin = await isAdminSession();
    if (wasAdmin) {
      redirect("/admin/empresas");
    }
    redirect("/login");
  }

  async function handleSelectCompany(owner: string) {
    "use server";
    return await setOwnerIdAsAdmin(owner);
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
                 {adminViewing ? "Visualizando como admin" : "Aqui está o resumo do seu desempenho"}
               </p>
             </div>
             <div className="flex flex-wrap items-center gap-3">
                {/* Admin Company Selector */}
                {isAdmin && (
                  <CompanySelector 
                    empresas={empresas.map(e => ({ owner: e.owner, nome_empresa: e.nome_empresa, ativo: e.ativo }))}
                    empresaAtual={{ owner: empresa.owner, nome_empresa: empresa.nome_empresa, ativo: empresa.ativo ?? true }}
                    onSelect={handleSelectCompany}
                  />
                )}
                
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
      </div>

      {/* Assistente IA */}
      <AssistenteIA ownerId={effectiveOwnerId} nomeEmpresa={empresa.nome_empresa} />
    </div>
  );
}
