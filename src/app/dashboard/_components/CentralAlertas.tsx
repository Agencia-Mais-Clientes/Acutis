"use client";

import { AnaliseProativa } from "../actions-proactive";
import { AlertTriangle, AlertOctagon, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CentralAlertasProps {
  alerts: AnaliseProativa[];
}

export function CentralAlertas({ alerts }: CentralAlertasProps) {
  if (alerts.length === 0) {
    return (
      <Card className="bg-[#0b0d11] border-gray-800 p-4 flex items-center justify-center gap-3">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-medium text-gray-400">Tudo sob controle. Nenhum alerta crítico detectado pela Acutis.</span>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Central de Alertas Críticos</h2>
        <span className="bg-red-950 text-red-500 text-[10px] px-1.5 py-0.5 rounded border border-red-900 font-bold uppercase">
          {alerts.length} Ocorrência(s)
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {alerts.map((alert, i) => (
          <div 
            key={i} 
            className={`relative overflow-hidden p-4 rounded-xl border transition-all hover:scale-[1.01] ${
              alert.nivel === "critical" 
              ? "bg-red-950/20 border-red-900 shadow-lg shadow-red-950/20" 
              : "bg-yellow-950/10 border-yellow-900/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 shrink-0 ${
                alert.nivel === "critical" ? "text-red-500" : "text-yellow-500"
              }`}>
                {alert.nivel === "critical" ? <AlertOctagon className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white leading-tight mb-1">{alert.titulo}</h4>
                <p className={`text-xs leading-relaxed mb-3 ${
                  alert.nivel === "critical" ? "text-red-200/70" : "text-yellow-200/70"
                }`}>
                  {alert.mensagem}
                </p>
                <div className={`text-[10px] font-bold p-2 rounded-lg border flex items-center gap-2 ${
                  alert.nivel === "critical" 
                  ? "bg-red-900/30 border-red-800 text-red-400" 
                  : "bg-yellow-900/30 border-yellow-800 text-yellow-500"
                }`}>
                  <ChevronRight className="h-3 w-3" />
                  <span>SUGESTÃO: {alert.sugestao}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
