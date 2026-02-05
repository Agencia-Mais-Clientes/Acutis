import { Card } from "@/components/ui/card";
import { KPIsSuporte } from "@/lib/types";
import { 
  Headphones, 
  Clock, 
  CheckCircle2, 
  Star,
  MessageCircle,
  Loader2
} from "lucide-react";

interface KPICardsSuporteProps {
  kpis: KPIsSuporte;
}

export function KPICardsSuporte({ kpis }: KPICardsSuporteProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* Total de Tickets - Blue Gradient */}
      <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Headphones className="h-24 w-24" />
        </div>
        <div className="p-6 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-white/90">Tickets Totais</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-bold tracking-tight">{kpis.totalTickets}</h3>
            <span className="text-xs font-medium bg-amber-400/20 text-amber-100 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-400/30">
              <MessageCircle className="h-3 w-3" />
              {kpis.ticketsAbertos} abertos
            </span>
          </div>
          <p className="text-xs text-cyan-100 mt-2 opacity-80">
            Total de atendimentos no período
          </p>
        </div>
      </Card>

      {/* Em Andamento - Amber */}
      <Card className="relative overflow-hidden border-none shadow-xl bg-white group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <Loader2 className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold text-amber-900">Em Andamento</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <h3 className="text-4xl font-bold tracking-tight text-amber-950">{kpis.ticketsEmAndamento}</h3>
          </div>
          
          <div className="w-full bg-amber-100/50 h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500 animate-pulse" 
              style={{ width: `${kpis.totalTickets > 0 ? (kpis.ticketsEmAndamento / kpis.totalTickets) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Aguardando resolução
          </p>
        </div>
      </Card>

      {/* Tempo Médio - Purple */}
      <Card className="relative overflow-hidden border-none shadow-xl bg-white group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold text-violet-900">Tempo Médio</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight text-violet-950">
              {kpis.tempoMedioResposta || "N/A"}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-gray-600">
              <strong className="text-emerald-600">{kpis.ticketsResolvidos}</strong> resolvidos
            </span>
          </div>
        </div>
      </Card>

      {/* Satisfação - Green */}
      <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Star className="h-24 w-24 rotate-12" />
        </div>
        <div className="p-6 relative z-10">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Star className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-white/90">Score Suporte</span>
          </div>
          
          <div className="flex items-center gap-3">
             <h3 className="text-4xl font-bold tracking-tight">{kpis.satisfacaoMedia}</h3>
             <div className="flex flex-col">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i <= Math.round(kpis.satisfacaoMedia / 20)
                          ? "fill-white text-white"
                          : "fill-white/30 text-white/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-white/80 font-medium uppercase tracking-wide mt-1">
                  {kpis.satisfacaoMedia >= 80 ? "Excelente" : kpis.satisfacaoMedia >= 60 ? "Bom" : "Regular"}
                </span>
             </div>
          </div>
           <p className="text-xs text-teal-100 mt-3 opacity-90 border-t border-white/20 pt-2">
            Qualidade de atendimento em suporte
          </p>
        </div>
      </Card>
    </div>
  );
}
