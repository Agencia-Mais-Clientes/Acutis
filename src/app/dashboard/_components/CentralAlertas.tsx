"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnaliseProativa } from "../actions-proactive";
import { AlertTriangle, AlertOctagon, ChevronDown, ChevronUp, Zap, X, Lightbulb, ExternalLink } from "lucide-react";

interface CentralAlertasProps {
  alerts: AnaliseProativa[];
}

export function CentralAlertas({ alerts }: CentralAlertasProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (alerts.length === 0 || isDismissed) {
    return null;
  }

  const criticalCount = alerts.filter(a => a.nivel === "critical").length;
  const warningCount = alerts.length - criticalCount;
  const firstAlert = alerts[0];
  const isCritical = firstAlert.nivel === "critical";

  return (
    <div className="relative">
      {/* Barra compacta */}
      <div 
        className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 ${
          isCritical 
            ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 hover:border-red-300" 
            : "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-300"
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* Ícone pulsante */}
          <div className={`relative p-2 rounded-lg ${isCritical ? "bg-red-500" : "bg-amber-500"}`}>
            <Zap className="h-4 w-4 text-white" />
            <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-ping ${isCritical ? "bg-red-400" : "bg-amber-400"}`} />
            <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${isCritical ? "bg-red-500" : "bg-amber-500"}`} />
          </div>
          
          {/* Texto do alerta */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isCritical ? "text-red-800" : "text-amber-800"}`}>
              {firstAlert.titulo}
            </span>
            {alerts.length > 1 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isCritical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
              }`}>
                +{alerts.length - 1} mais
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badges de contagem */}
          <div className="hidden sm:flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500 text-white font-bold">
                <AlertOctagon className="h-3 w-3" />
                {criticalCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500 text-white font-bold">
                <AlertTriangle className="h-3 w-3" />
                {warningCount}
              </span>
            )}
          </div>

          {/* Botão expandir/colapsar */}
          <button 
            className={`p-1.5 rounded-lg transition-colors ${
              isCritical ? "hover:bg-red-100" : "hover:bg-amber-100"
            }`}
          >
            {isExpanded ? (
              <ChevronUp className={`h-4 w-4 ${isCritical ? "text-red-600" : "text-amber-600"}`} />
            ) : (
              <ChevronDown className={`h-4 w-4 ${isCritical ? "text-red-600" : "text-amber-600"}`} />
            )}
          </button>

          {/* Botão fechar */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              isCritical ? "hover:bg-red-100" : "hover:bg-amber-100"
            }`}
          >
            <X className={`h-4 w-4 ${isCritical ? "text-red-400" : "text-amber-400"}`} />
          </button>
        </div>
      </div>

      {/* Área expandida com detalhes */}
      {isExpanded && (
        <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {alerts.map((alert, i) => {
            const alertCritical = alert.nivel === "critical";
            const hasLink = !!alert.linkUrl;
            
            const handleAlertClick = () => {
              if (alert.linkUrl) {
                router.push(alert.linkUrl);
              }
            };
            
            return (
              <div 
                key={i} 
                onClick={hasLink ? handleAlertClick : undefined}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  alertCritical 
                    ? "bg-white border-red-100" 
                    : "bg-white border-amber-100"
                } ${hasLink ? "cursor-pointer hover:shadow-md hover:scale-[1.01]" : ""}`}
              >
                <div className={`p-1.5 rounded-md shrink-0 ${
                  alertCritical ? "bg-red-100" : "bg-amber-100"
                }`}>
                  {alertCritical 
                    ? <AlertOctagon className="h-4 w-4 text-red-600" /> 
                    : <AlertTriangle className="h-4 w-4 text-amber-600" />
                  }
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-semibold ${alertCritical ? "text-red-800" : "text-amber-800"}`}>
                      {alert.titulo}
                    </h4>
                    {hasLink && (
                      <ExternalLink className={`h-3.5 w-3.5 ${alertCritical ? "text-red-400" : "text-amber-400"}`} />
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${alertCritical ? "text-red-600/80" : "text-amber-600/80"}`}>
                    {alert.mensagem}
                  </p>
                  
                  {alert.sugestao && (
                    <div className={`mt-2 flex items-start gap-1.5 text-xs p-2 rounded-md ${
                      alertCritical ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{alert.sugestao}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
