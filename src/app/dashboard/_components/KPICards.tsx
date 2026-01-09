import { Card } from "@/components/ui/card";
import { KPIs } from "@/lib/types";
import { TrendingUp, Users, Calendar, Star, ArrowUpRight } from "lucide-react";

interface KPICardsProps {
  kpis: KPIs;
}

export function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Leads de Vendas - Purple Gradient */}
      <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Users className="h-24 w-24" />
        </div>
        <div className="p-6 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-white/90">Leads Totais</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-bold tracking-tight">{kpis.totalLeads}</h3>
            <span className="text-xs font-medium bg-emerald-400/20 text-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-400/30">
              <ArrowUpRight className="h-3 w-3" />
              {kpis.leadsNovos} novos
            </span>
          </div>
          <p className="text-xs text-indigo-100 mt-2 opacity-80">
            Novos nos últimos {kpis.periodo} dias
          </p>
        </div>
      </Card>

      {/* Taxa de Sucesso - Emerald Gradient */}
      <Card className="relative overflow-hidden border-none shadow-xl bg-white group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold text-emerald-900">Conversão</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <h3 className="text-4xl font-bold tracking-tight text-emerald-950">{kpis.taxaSucesso}%</h3>
          </div>
          
          <div className="w-full bg-emerald-100/50 h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${kpis.taxaSucesso}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Taxa de fechamento global
          </p>
        </div>
      </Card>

      {/* Agendados - Blue Gradient */}
      <Card className="relative overflow-hidden border-none shadow-xl bg-white group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold text-blue-900">Agendamentos</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-bold tracking-tight text-blue-950">{kpis.totalAgendado}</h3>
             <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
              {kpis.periodo} dias
            </span>
          </div>
           <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
             <span className="font-bold text-emerald-600">{kpis.totalVendido}</span> matriculados confirmados
           </p>
        </div>
      </Card>

      {/* Nota Média - Amber/Gold */}
      <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Star className="h-24 w-24 rotate-12" />
        </div>
        <div className="p-6 relative z-10">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Star className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-white/90">Satisfaction Score</span>
          </div>
          
          <div className="flex items-center gap-3">
             <h3 className="text-4xl font-bold tracking-tight">{kpis.notaMedia}</h3>
             <div className="flex flex-col">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i <= Math.round(kpis.notaMedia / 20)
                          ? "fill-white text-white"
                          : "fill-white/30 text-white/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-white/80 font-medium uppercase tracking-wide mt-1">
                  Excelente
                </span>
             </div>
          </div>
           <p className="text-xs text-orange-100 mt-3 opacity-90 border-t border-white/20 pt-2">
            Baseado em avaliações recentes
          </p>
        </div>
      </Card>
    </div>
  );
}
