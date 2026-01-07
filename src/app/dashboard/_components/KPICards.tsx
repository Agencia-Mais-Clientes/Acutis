import { Card, CardContent } from "@/components/ui/card";
import { KPIs } from "@/lib/types";
import { TrendingUp, Users, Calendar, Star } from "lucide-react";

interface KPICardsProps {
  kpis: KPIs;
}

export function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Leads de Vendas */}
      <Card className="bg-[#0b0d11] border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Leads de Vendas
              </p>
              <p className="text-3xl font-bold text-white mt-1">{kpis.totalLeads}</p>
              <p className="text-xs text-gray-500 mt-1">
                +{kpis.totalSuporte} suporte
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Sucesso */}
      <Card className="bg-[#0b0d11] border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Taxa de Sucesso
              </p>
              <p className="text-3xl font-bold text-green-500 mt-1">{kpis.taxaSucesso}%</p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${kpis.taxaSucesso}%` }}
                />
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agendados */}
      <Card className="bg-[#0b0d11] border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Agendados
              </p>
              <p className="text-3xl font-bold text-blue-400 mt-1">{kpis.totalAgendado}</p>
              <p className="text-xs text-gray-500 mt-1">
                {kpis.totalVendido} matriculados
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nota Média */}
      <Card className="bg-[#0b0d11] border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Nota Média
              </p>
              <p className="text-3xl font-bold text-yellow-400 mt-1">{kpis.notaMedia}</p>
              <div className="flex gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i <= Math.round(kpis.notaMedia / 20)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-700"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
