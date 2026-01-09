"use client";

import { AnaliseProativa } from "../actions-proactive";
import { AlertTriangle, AlertOctagon, ChevronRight, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CentralAlertasProps {
  alerts: AnaliseProativa[];
}

export function CentralAlertas({ alerts }: CentralAlertasProps) {
  if (alerts.length === 0) {
    return (
      <Card className="p-4 flex items-center justify-center gap-2 border-none shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium text-emerald-700">
          ✨ Tudo sob controle. Nenhum alerta crítico.
        </span>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with gradient accent */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg shadow-lg shadow-red-500/20">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-sm font-bold text-foreground">
            Central de Alertas
          </h2>
        </div>
        <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-lg shadow-red-500/20 animate-pulse">
          {alerts.length} Críticos
        </span>
      </div>
      
      {/* Alert Cards */}
      <div className="flex flex-col gap-3">
        {alerts.map((alert, i) => {
          const isCritical = alert.nivel === "critical";
          return (
            <div 
              key={i} 
              className={`group relative overflow-hidden flex items-start gap-4 p-5 rounded-xl border shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] ${
                isCritical
                ? "bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 border-red-200" 
                : "bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-200"
              }`}
            >
              {/* Pulsing indicator */}
              <div className={`absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse ${isCritical ? "bg-red-500" : "bg-amber-500"}`} />
              
              <div className={`p-2 rounded-xl shadow-md ${
                isCritical ? "bg-gradient-to-br from-red-500 to-rose-600" : "bg-gradient-to-br from-amber-500 to-orange-500"
              }`}>
                {isCritical ? <AlertOctagon className="h-5 w-5 text-white" /> : <AlertTriangle className="h-5 w-5 text-white" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-bold leading-tight ${isCritical ? "text-red-900" : "text-amber-900"}`}>
                  {alert.titulo}
                </h4>
                <p className={`text-xs leading-relaxed mt-1 ${isCritical ? "text-red-700/80" : "text-amber-700/80"}`}>
                  {alert.mensagem}
                </p>
                
                {alert.sugestao && (
                  <div className={`mt-3 flex items-start gap-2 text-[11px] p-3 rounded-lg border ${
                    isCritical ? "bg-white/60 border-red-200 text-red-800" : "bg-white/60 border-amber-200 text-amber-800"
                  }`}>
                    <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
                    <span><span className="font-bold">💡 Sugestão:</span> {alert.sugestao}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
