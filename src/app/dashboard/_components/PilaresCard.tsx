"use client";

import { PilaresAtendimento, AnaliseQualitativa } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Target, 
  TrendingUp, 
  Shield, 
  Lightbulb,
  AlertTriangle,
  Zap,
  XCircle
} from "lucide-react";

interface PilaresCardProps {
  pilares: PilaresAtendimento;
  analiseQualitativa?: AnaliseQualitativa;
}

// Color scale based on score
function getScoreColor(nota: number) {
  if (nota >= 80) return { bg: "bg-emerald-500", text: "text-emerald-700", bgLight: "bg-emerald-100" };
  if (nota >= 60) return { bg: "bg-yellow-500", text: "text-yellow-700", bgLight: "bg-yellow-100" };
  if (nota >= 40) return { bg: "bg-orange-500", text: "text-orange-700", bgLight: "bg-orange-100" };
  return { bg: "bg-red-500", text: "text-red-700", bgLight: "bg-red-100" };
}

// Pilar config with icons and labels
const PILARES_CONFIG = {
  rapport_conexao: {
    label: "Rapport",
    description: "Conexão inicial",
    icon: Heart,
    weight: "20%"
  },
  personalizacao: {
    label: "Personalização",
    description: "Adequação ao perfil",
    icon: Target,
    weight: "30%"
  },
  conducao_fechamento: {
    label: "Fechamento",
    description: "Condução da venda",
    icon: TrendingUp,
    weight: "30%"
  },
  tratamento_objecoes: {
    label: "Objeções",
    description: "Tratamento de barreiras",
    icon: Shield,
    weight: "20%"
  }
} as const;

export function PilaresCard({ pilares, analiseQualitativa }: PilaresCardProps) {
  const notaGeral = pilares.nota_geral;
  const notaGeralColor = getScoreColor(notaGeral);

  return (
    <div className="space-y-4">
      {/* Nota Geral */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-bold text-violet-600 uppercase tracking-widest">
            📊 Avaliação por Pilares
          </h3>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${notaGeralColor.bgLight}`}>
            <span className={`text-lg font-bold ${notaGeralColor.text}`}>{notaGeral}</span>
            <span className="text-xs text-gray-500">/100</span>
          </div>
        </div>

        {/* Pilares Grid */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(PILARES_CONFIG).map(([key, config]) => {
            const pilarKey = key as keyof typeof PILARES_CONFIG;
            const pilar = pilares[pilarKey];
            const colors = getScoreColor(pilar.nota);
            const Icon = config.icon;

            return (
              <div
                key={key}
                className="relative overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-3"
              >
                {/* Score bar at top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
                  <div
                    className={`h-full ${colors.bg} transition-all duration-500`}
                    style={{ width: `${pilar.nota}%` }}
                  />
                </div>

                {/* Content */}
                <div className="mt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${colors.text}`} />
                    <span className="text-xs font-semibold text-gray-700">{config.label}</span>
                    <span className={`ml-auto text-sm font-bold ${colors.text}`}>{pilar.nota}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">{config.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalhes por Pilar (expandido) */}
      <div className="space-y-3">
        {Object.entries(PILARES_CONFIG).map(([key, config]) => {
          const pilarKey = key as keyof typeof PILARES_CONFIG;
          const pilar = pilares[pilarKey];
          const colors = getScoreColor(pilar.nota);
          const Icon = config.icon;

          return (
            <div key={key} className={`${colors.bgLight} rounded-xl p-4 border ${colors.text.replace('text', 'border')}/30`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${colors.text}`} />
                <span className="text-sm font-bold text-gray-800">{config.label}</span>
                <Badge className={`${colors.bg} text-white text-[10px] px-2 py-0.5`}>
                  {pilar.nota}/100
                </Badge>
              </div>
              
              {/* Feedback */}
              <div className="mb-2">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Observação</p>
                <p className="text-xs text-gray-700">{pilar.feedback}</p>
              </div>
              
              {/* Sugestão */}
              <div className="bg-white/60 rounded-lg p-2.5 border border-white">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <p className="text-[10px] uppercase font-bold text-amber-700">Sugestão de Melhoria</p>
                </div>
                <p className="text-xs text-gray-700 italic">{pilar.sugestao}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Análise Qualitativa */}
      {analiseQualitativa && (
        <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 space-y-4">
          <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            <Zap className="h-4 w-4" /> Análise Qualitativa
          </h3>

          {/* Linguagem */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Linguagem:</span>
            <Badge className={
              analiseQualitativa.linguagem.avaliacao === "Excelente" ? "bg-emerald-100 text-emerald-700" :
              analiseQualitativa.linguagem.avaliacao === "Boa" ? "bg-blue-100 text-blue-700" :
              analiseQualitativa.linguagem.avaliacao === "Regular" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }>
              {analiseQualitativa.linguagem.avaliacao}
            </Badge>
            <span className="text-xs text-gray-600">{analiseQualitativa.linguagem.observacoes}</span>
          </div>

          {/* Gatilhos */}
          <div className="grid grid-cols-2 gap-3">
            {analiseQualitativa.gatilhos_aplicados.length > 0 && (
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                <p className="text-[10px] uppercase font-bold text-emerald-700 mb-2">✅ Gatilhos Usados</p>
                <div className="flex flex-wrap gap-1.5">
                  {analiseQualitativa.gatilhos_aplicados.map((g, i) => (
                    <Badge key={i} className="bg-emerald-100 text-emerald-800 text-[10px]">{g}</Badge>
                  ))}
                </div>
              </div>
            )}
            {analiseQualitativa.gatilhos_faltantes.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <p className="text-[10px] uppercase font-bold text-amber-700 mb-2">⚠️ Gatilhos Faltantes</p>
                <div className="flex flex-wrap gap-1.5">
                  {analiseQualitativa.gatilhos_faltantes.map((g, i) => (
                    <Badge key={i} className="bg-amber-100 text-amber-800 text-[10px]">{g}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Erros Críticos */}
          {analiseQualitativa.erros_criticos.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <p className="text-[10px] uppercase font-bold text-red-700 mb-2 flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> Erros Críticos
              </p>
              <ul className="space-y-1.5">
                {analiseQualitativa.erros_criticos.map((erro, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    {erro}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Diagnóstico Final */}
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-4 border border-violet-100">
            <p className="text-[10px] uppercase font-bold text-violet-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Diagnóstico Final
            </p>
            <p className="text-sm text-gray-700">{analiseQualitativa.diagnostico_final}</p>
            {analiseQualitativa.momento_perda && (
              <p className="text-xs text-red-600 mt-2 italic">
                💔 Momento da perda: {analiseQualitativa.momento_perda}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
