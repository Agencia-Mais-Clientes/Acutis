"use client";

import { AnaliseConversa } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User, Lightbulb, Zap, MessageSquare, AlertTriangle, Sparkles } from "lucide-react";
import { PilaresCard } from "./PilaresCard";

interface DetalheLeadProps {
  analise: AnaliseConversa;
  open: boolean;
  onClose: () => void;
}

// Mapeia origem do tracking para texto de exibição
function mapOrigemTracking(origem: string): string {
  switch (origem) {
    case "facebook_ads": return "Meta";
    case "instagram_ads": return "Meta";
    case "google_ads": return "Google";
    case "organico": return "Orgânico";
    default: return origem;
  }
}

// Mapeia categoria de objeção para label amigável
function getCategoriaLabel(categoria: string): string {
  const labels: Record<string, string> = {
    preco: "💰 Preço",
    tempo: "⏰ Tempo",
    localizacao: "📍 Local",
    saude: "🏥 Saúde",
    compromisso: "😰 Compromisso",
    consulta_terceiros: "👨‍👩‍👧 Consulta",
    adiamento: "📅 Adiamento",
    fidelidade: "📝 Contrato",
    concorrencia: "🏆 Concorrência",
    interesse_baixo: "😐 Interesse",
    outros: "❓ Outros",
  };
  return labels[categoria] || categoria;
}

export function DetalheLead({ analise, open, onClose }: DetalheLeadProps) {
  const resultado = analise.resultado_ia;
  const nome = resultado?.dados_cadastrais?.nome_lead || "Não identificado";
  const vendedor = resultado?.dados_cadastrais?.nome_vendedor || "Atendente";
  // Usa origem_tracking (real do tracking) ou fallback para inferência IA
  const origemTracking = analise.origem_tracking;
  const origem = origemTracking ? mapOrigemTracking(origemTracking) : (resultado?.dados_cadastrais?.origem_detectada || "Orgânico");
  const resumo = resultado?.resumo_executivo || "Sem resumo disponível";
  const proximoPasso = resultado?.proximo_passo_sugerido || "Acompanhar o lead";
  const objecoes = resultado?.objecoes_detectadas || [];
  const pontosFortes = resultado?.performance_vendas?.pontos_fortes || [];
  const pontosMelhoria = resultado?.performance_vendas?.pontos_melhoria || [];
  const metrics = resultado?.metrics;
  const detalhesConversao = resultado?.detalhes_conversao;

  // Origin badge colors
  const getOrigemStyle = (o: string) => {
    const ol = o.toLowerCase();
    if (ol.includes("meta") || ol.includes("insta") || ol.includes("face")) {
      return "bg-blue-500 text-white";
    }
    if (ol.includes("google")) {
      return "bg-orange-500 text-white";
    }
    if (ol.includes("indica")) {
      return "bg-purple-500 text-white";
    }
    return "bg-gray-500 text-white";
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-gray-50 w-full sm:max-w-xl overflow-y-auto border-l-0 shadow-2xl p-0">
        {/* Premium Header with Gradient */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-6 text-white">
          <SheetHeader className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                {nome.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-2 flex-1">
                <SheetTitle className="text-xl font-bold text-white leading-none">
                  {nome}
                </SheetTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase shadow-md ${getOrigemStyle(origem)}`}>
                    {origem}
                  </span>
                  <span className="text-white/70 text-xs">•</span>
                  <span className="text-white/80 text-xs">
                    Vendedor: <span className="font-semibold text-white">{vendedor}</span>
                  </span>
                </div>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="space-y-5 p-6">
          {/* Resumo Executivo */}
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <h3 className="text-[11px] font-bold text-violet-600 uppercase tracking-widest flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4" /> Resumo Executivo
            </h3>
            <p className="text-sm text-gray-700 italic leading-relaxed">
              &quot;{resumo}&quot;
            </p>
          </div>

          {/* Métricas */}
          {metrics && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl text-white shadow-lg">
                <p className="text-[10px] text-blue-100 uppercase font-bold flex items-center gap-1.5 mb-1">
                  <Zap className="h-3 w-3" /> 1ª Resposta
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {metrics.tempo_primeira_resposta_texto || "--"}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl text-white shadow-lg">
                <p className="text-[10px] text-purple-100 uppercase font-bold flex items-center gap-1.5 mb-1">
                  <Clock className="h-3 w-3" /> Cadência Média
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {metrics.tempo_medio_resposta_texto || "--"}
                </p>
              </div>
            </div>
          )}

          {/* Pilares de Qualidade (NOVO) */}
          {resultado?.pilares_atendimento && (
            <PilaresCard 
              pilares={resultado.pilares_atendimento} 
              analiseQualitativa={resultado.analise_qualitativa}
            />
          )}

          {/* Objeções */}
          {objecoes.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
              <h3 className="text-[11px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4" /> Objeções Identificadas
              </h3>
              <div className="flex flex-col gap-2">
                {objecoes.map((obj, i) => {
                  // Suporta novo formato (objeto) e legado (string)
                  const texto = typeof obj === "object" && "categoria" in obj 
                    ? `${getCategoriaLabel(obj.categoria)}: ${obj.evidencia}`
                    : String(obj);
                  return (
                    <Badge
                      key={i}
                      className="bg-amber-100 border-amber-300 text-amber-800 text-xs px-3 py-1.5 font-semibold rounded-lg w-full break-words whitespace-normal text-left"
                    >
                      {texto}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Performance - Side by Side on larger screens */}
          <div className="grid grid-cols-1 gap-4">
            {pontosFortes.length > 0 && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200 shadow-sm">
                <h3 className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4" /> Pontos Fortes
                </h3>
                <ul className="space-y-2.5">
                  {pontosFortes.slice(0, 3).map((ponto, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-emerald-800 text-xs leading-relaxed"
                    >
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{ponto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pontosMelhoria.length > 0 && (
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border border-red-200 shadow-sm">
                <h3 className="text-[11px] font-bold text-red-700 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <XCircle className="h-4 w-4" /> Pontos de Melhoria
                </h3>
                <ul className="space-y-2.5">
                  {pontosMelhoria.slice(0, 3).map((ponto, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-red-800 text-xs leading-relaxed"
                    >
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <span>{ponto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Próximo Passo - Action Card */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-5 shadow-lg text-white">
            <h3 className="text-[10px] font-bold text-violet-200 uppercase mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-yellow-300" /> Ação Sugerida
            </h3>
            <p className="text-sm font-medium leading-relaxed">{proximoPasso}</p>
          </div>

          {/* Detalhes da Conversão */}
          {detalhesConversao && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-5 rounded-xl text-center shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <p className="text-[10px] font-bold text-emerald-100 uppercase">
                  Detalhes do Fechamento
                </p>
              </div>
              <p className="text-sm font-medium">{detalhesConversao}</p>
            </div>
          )}

          {/* Rodapé Metadata */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Responsável: <span className="font-medium text-gray-700">{vendedor}</span></span>
              </div>
              <span className="font-mono text-[10px] opacity-70">
                ID: {analise.id.substring(0, 8)} • {new Date(analise.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
