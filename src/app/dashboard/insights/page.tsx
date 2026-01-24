import { redirect } from "next/navigation";
import { getOwnerId, isAdminSession } from "@/lib/auth";
import { getInsightsAgencia } from "../actions-dashboard";
import { FadeIn } from "@/components/ui/motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function InsightsPage() {
  const isAdmin = await isAdminSession();
  
  // Apenas admin pode acessar
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const ownerId = await getOwnerId();

  if (!ownerId) {
    redirect("/login");
  }

  const insights = await getInsightsAgencia(ownerId);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <FadeIn duration={0.6}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 md:p-8 shadow-xl">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-24 -mb-24" />
          
          <div className="relative z-10">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Link>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-violet-500/20 rounded-xl border border-violet-500/30">
                <Sparkles className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Insights Agência
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  KPIs e sugestões para otimização de campanhas
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {insights.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum insight disponível
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Aguarde mais conversas serem analisadas para gerar insights acionáveis sobre objeções, canais e conversão.
            </p>
          </div>
        ) : (
          insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))
        )}
      </div>
    </div>
  );
}

import { InsightAgencia } from "@/lib/types";
import { 
  Lightbulb, 
  Clock, 
  Target, 
  MessageSquare, 
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function InsightCard({ insight }: { insight: InsightAgencia }) {
  const Icon = tipoIcons[insight.tipo] || Lightbulb;
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={cn(
          "p-3 rounded-xl bg-gradient-to-br shadow-lg",
          impactColors[insight.impacto]
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {insight.titulo}
            </h3>
          </div>
          <span className={cn(
            "inline-block text-xs font-bold uppercase px-2 py-0.5 rounded border",
            impactBadgeColors[insight.impacto]
          )}>
            Impacto {insight.impacto}
          </span>
        </div>
      </div>

      {/* Descrição */}
      <p className="text-gray-600 text-sm mb-4">
        {insight.descricao}
      </p>

      {/* Dados */}
      {insight.dados && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
          <span className="text-4xl font-bold text-gray-900">
            {insight.dados.valor}%
          </span>
          {insight.dados.comparativo !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <TrendIcon trend={insight.dados.tendencia} />
              <span>
                {insight.dados.tendencia === "up" ? "+" : ""}
                {insight.dados.comparativo}% vs período anterior
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sugestão */}
      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
        <Lightbulb className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1">
            Sugestão
          </p>
          <p className="text-sm text-yellow-800">
            {insight.sugestao}
          </p>
        </div>
      </div>
    </div>
  );
}
