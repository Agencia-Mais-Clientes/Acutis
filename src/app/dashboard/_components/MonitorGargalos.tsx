"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gargalo } from "@/lib/types";
import { AlertTriangle, TrendingDown, Clock, ChevronRight } from "lucide-react";

interface MonitorGargalosProps {
  gargalos: Gargalo[];
  totalLeads: number;
}

// Mapeia descrição do gargalo para query param
function getGargaloFilterParam(descricao: string): string {
  const desc = descricao.toLowerCase();
  
  // Mapeamentos baseados nos tipos retornados pela IA
  if (desc.includes("travado") || desc.includes("parado") || desc.includes("estagnado")) {
    // Tenta identificar a fase onde está travado
    if (desc.includes("negociação") || desc.includes("negociacao")) return "negociacao";
    if (desc.includes("agendamento")) return "agendamento";
    if (desc.includes("qualificação")) return "qualificacao";
    return "travado"; 
  }
  
  if (desc.includes("sem resposta") || desc.includes("vácuo") || desc.includes("vacuo")) return "sem_resposta";
  if (desc.includes("perdido") || desc.includes("desistiu")) return "perdido";
  if (desc.includes("demora") || desc.includes("tempo")) return "demora_resposta";
  
  return "outros";
}

export function MonitorGargalos({ gargalos, totalLeads }: MonitorGargalosProps) {
  if (gargalos.length === 0) {
    return (
      <Card className="shadow-lg border-none bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            Monitor de Gargalos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground/80">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-emerald-700">Nenhum gargalo identificado</p>
            <p className="text-xs text-muted-foreground mt-1">Seu funil está saudável! ✨</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-none bg-white overflow-hidden flex flex-col h-full">
      <CardHeader className="pb-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          Monitor de Gargalos
          <span className="ml-auto text-[10px] font-bold text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full bg-amber-100">
             {gargalos.length} alertas
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5 flex-1 overflow-y-auto max-h-[250px] md:max-h-[300px] scrollbar-thin scrollbar-thumb-gray-200 px-3 md:px-6">
          {gargalos.map((gargalo) => {
            const percentual = totalLeads > 0 ? Math.round((gargalo.quantidade / totalLeads) * 100) : 0;
            const isRed = gargalo.cor === "red";
            const filterParam = getGargaloFilterParam(gargalo.descricao);
            
            // Usa ?fase=perdido para tipo perdido, pois é fase do funil
            const href = gargalo.tipo === "perdido" || filterParam === "perdido"
              ? "/dashboard/analises?fase=perdido"
              : `/dashboard/analises?gargalo=${filterParam}`;
            
            return (
              <Link 
                key={`${gargalo.tipo}-${gargalo.descricao}`} 
                href={href}
                className="block group"
              >
              <div className="space-y-2 p-2 rounded-lg transition-colors hover:bg-gray-50 -mx-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${isRed ? "bg-red-100" : "bg-amber-100"}`}>
                      {isRed ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      ) : (
                        <Clock className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                    <span className={`text-xs font-semibold group-hover:underline decoration-dotted underline-offset-2 ${isRed ? "text-red-700" : "text-amber-700"}`}>
                      {gargalo.descricao}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-bold tabular-nums ${isRed ? "text-red-600" : "text-amber-600"}`}>
                      {gargalo.quantidade}
                    </span>
                    <ChevronRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 group-hover:brightness-95 ${
                      isRed 
                        ? "bg-gradient-to-r from-red-400 to-red-500" 
                        : "bg-gradient-to-r from-amber-400 to-orange-400"
                    }`}
                    style={{ width: `${Math.min(percentual * 2, 100)}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
