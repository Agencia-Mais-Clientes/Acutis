import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gargalo } from "@/lib/types";
import { AlertTriangle, TrendingDown, Clock } from "lucide-react";

interface MonitorGargalosProps {
  gargalos: Gargalo[];
  totalLeads: number;
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
    <Card className="shadow-lg border-none bg-white overflow-hidden">
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
      <CardContent className="space-y-5 pt-5">
        {gargalos.map((gargalo) => {
          const percentual = totalLeads > 0 ? Math.round((gargalo.quantidade / totalLeads) * 100) : 0;
          const isRed = gargalo.cor === "red";
          
          return (
            <div key={gargalo.tipo} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${isRed ? "bg-red-100" : "bg-amber-100"}`}>
                    {isRed ? (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : (
                      <Clock className="h-3 w-3 text-amber-500" />
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${isRed ? "text-red-700" : "text-amber-700"}`}>
                    {gargalo.descricao}
                  </span>
                </div>
                <span className={`text-sm font-bold tabular-nums ${isRed ? "text-red-600" : "text-amber-600"}`}>
                  {gargalo.quantidade}
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${
                    isRed 
                      ? "bg-gradient-to-r from-red-400 to-red-500" 
                      : "bg-gradient-to-r from-amber-400 to-orange-400"
                  }`}
                  style={{ width: `${Math.min(percentual * 2, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
