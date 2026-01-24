"use client";

import { InsightAgencia } from "@/lib/types";
import { 
  Lightbulb, 
  Clock, 
  Target, 
  MessageSquare, 
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgencyInsightsPanelProps {
  insights: InsightAgencia[];
  className?: string;
}

const tipoIcons = {
  objecao: MessageSquare,
  horario: Clock,
  canal: Target,
  keywords: Lightbulb,
  conversao: TrendingUp,
};

const impactColors = {
  alto: "from-red-500 to-orange-500",
  medio: "from-amber-500 to-yellow-500",
  baixo: "from-blue-500 to-cyan-500",
};

const impactBadgeColors = {
  alto: "bg-red-100 text-red-700 border-red-200",
  medio: "bg-amber-100 text-amber-700 border-amber-200",
  baixo: "bg-blue-100 text-blue-700 border-blue-200",
};

function TrendIcon({ trend }: { trend?: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-gray-400" />;
}

export function AgencyInsightsPanel({ insights, className }: AgencyInsightsPanelProps) {
  if (!insights || insights.length === 0) {
    return (
      <div className={cn("w-80 bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-5 flex-shrink-0", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-bold text-white">Insights Agência</h2>
        </div>
        <p className="text-gray-400 text-sm">
          Nenhum insight disponível ainda. Aguarde mais dados serem processados.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-80 bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-5 flex-shrink-0 h-fit",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 bg-violet-500/20 rounded-lg">
          <Sparkles className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Insights Agência</h2>
          <p className="text-xs text-gray-400">KPIs para otimização</p>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map((insight) => {
          const Icon = tipoIcons[insight.tipo] || Lightbulb;
          
          return (
            <div
              key={insight.id}
              className="group p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all duration-200 cursor-pointer"
            >
              {/* Header do Insight */}
              <div className="flex items-start gap-3 mb-3">
                <div className={cn(
                  "p-2 rounded-lg bg-gradient-to-br",
                  impactColors[insight.impacto]
                )}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {insight.titulo}
                    </h3>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border",
                      impactBadgeColors[insight.impacto]
                    )}>
                      {insight.impacto}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {insight.descricao}
                  </p>
                </div>
              </div>

              {/* Dados */}
              {insight.dados && (
                <div className="flex items-center gap-3 mb-3 pl-11">
                  <span className="text-2xl font-bold text-white">
                    {insight.dados.valor}%
                  </span>
                  {insight.dados.comparativo !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <TrendIcon trend={insight.dados.tendencia} />
                      <span>
                        {insight.dados.tendencia === "up" ? "+" : ""}
                        {insight.dados.comparativo}% vs anterior
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Sugestão */}
              <div className="flex items-center gap-2 pl-11 group-hover:translate-x-1 transition-transform">
                <Lightbulb className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                <p className="text-xs text-yellow-200/80 line-clamp-2">
                  {insight.sugestao}
                </p>
                <ChevronRight className="h-3 w-3 text-gray-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-white/10">
        <p className="text-[10px] text-gray-500 text-center uppercase tracking-wider">
          Atualizado com base nas conversas
        </p>
      </div>
    </div>
  );
}
