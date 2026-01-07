import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gargalo } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

interface MonitorGargalosProps {
  gargalos: Gargalo[];
  totalLeads: number;
}

export function MonitorGargalos({ gargalos, totalLeads }: MonitorGargalosProps) {
  if (gargalos.length === 0) {
    return (
      <Card className="bg-[#0b0d11] border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-1 h-4 bg-yellow-500 rounded" />
            Monitor de Gargalos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Nenhum gargalo identificado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0b0d11] border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <span className="w-1 h-4 bg-yellow-500 rounded" />
          Monitor de Gargalos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gargalos.map((gargalo) => {
          const percentual = totalLeads > 0 ? Math.round((gargalo.quantidade / totalLeads) * 100) : 0;
          const barColor = gargalo.cor === "red" ? "bg-red-500/60" : "bg-yellow-500/60";
          
          return (
            <div key={gargalo.tipo} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-2">
                  {gargalo.cor === "red" ? (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  )}
                  {gargalo.descricao}
                </span>
                <span className="text-xs text-white font-bold">{gargalo.quantidade}</span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`${barColor} h-1.5 rounded-full transition-all duration-500`}
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
