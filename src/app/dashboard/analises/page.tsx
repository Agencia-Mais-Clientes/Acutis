import { redirect } from "next/navigation";
import { getOwnerId, getEmpresa } from "@/lib/auth";
import { getAnalises } from "../actions";
import { TabelaAuditoria } from "../_components/TabelaAuditoria";
import { BarChart3 } from "lucide-react";
import { FadeIn, SlideUp } from "@/components/ui/motion";

export default async function AnalisesPage() {
  const ownerId = await getOwnerId();

  if (!ownerId) {
    redirect("/login");
  }

  const empresa = await getEmpresa(ownerId);

  if (!empresa) {
    redirect("/login");
  }

  const analises = await getAnalises(ownerId);

  return (
    <div className="p-4 md:p-8 space-y-6">
       {/* Header */}
       <FadeIn duration={0.6}>
         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 md:p-8 shadow-xl">
           {/* Background decoration */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
           
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
               <div className="flex items-center gap-2 mb-2">
                 <BarChart3 className="h-5 w-5 text-blue-200" />
                 <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                   Análises de Conversas
                 </span>
               </div>
               <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                 Registro de Atendimentos
               </h1>
               <p className="text-white/70 text-sm mt-1">
                 Visualize e filtre todas as análises de conversas
               </p>
             </div>
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg">
                 <span className="text-sm font-medium text-white">
                   {analises.length} análises
                 </span>
               </div>
             </div>
           </div>
         </div>
       </FadeIn>

      {/* Tabela de Auditoria */}
      <SlideUp delay={0.1}>
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <TabelaAuditoria analises={analises} />
        </div>
      </SlideUp>
    </div>
  );
}
