"use client";

import { AnaliseConversa } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User, Target, Lightbulb } from "lucide-react";

interface DetalheLeadProps {
  analise: AnaliseConversa;
  open: boolean;
  onClose: () => void;
}

export function DetalheLead({ analise, open, onClose }: DetalheLeadProps) {
  const resultado = analise.resultado_ia;
  const nome = resultado?.dados_cadastrais?.nome_lead || "Não identificado";
  const vendedor = resultado?.dados_cadastrais?.nome_vendedor || "Atendente";
  const origem = resultado?.dados_cadastrais?.origem_detectada || "Orgânico";
  const resumo = resultado?.resumo_executivo || "Sem resumo disponível";
  const proximoPasso = resultado?.proximo_passo_sugerido || "Acompanhar o lead";
  const objecoes = resultado?.objecoes_detectadas || [];
  const pontosFortes = resultado?.performance_vendas?.pontos_fortes || [];
  const pontosMelhoria = resultado?.performance_vendas?.pontos_melhoria || [];
  const metrics = resultado?.metrics;
  const detalhesConversao = resultado?.detalhes_conversao;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-[#0b0d11] border-gray-800 w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="border-b border-gray-800 pb-4">
          <SheetTitle className="text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1c2128] border border-gray-700 flex items-center justify-center text-sm font-bold text-white">
              {nome.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-bold">{nome}</p>
              <p className="text-xs text-gray-500 font-normal">
                Origem: {origem} • Vendedor: {vendedor}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Resumo Executivo */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Target className="h-3 w-3" /> Resumo Executivo
            </h3>
            <p className="text-sm text-gray-400 italic bg-[#161b22] p-4 rounded-lg border border-gray-800 leading-relaxed">
              &quot;{resumo}&quot;
            </p>
          </div>

          {/* Métricas */}
          {metrics && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#161b22] p-4 rounded-lg border border-gray-800">
                <p className="text-[9px] text-gray-500 uppercase flex items-center gap-1">
                  <Clock className="h-3 w-3" /> 1ª Resposta
                </p>
                <p className="text-xl font-mono text-white mt-1">
                  {metrics.tempo_primeira_resposta_texto || "--"}
                </p>
              </div>
              <div className="bg-[#161b22] p-4 rounded-lg border border-gray-800">
                <p className="text-[9px] text-gray-500 uppercase flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Cadência
                </p>
                <p className="text-xl font-mono text-white mt-1">
                  {metrics.tempo_medio_resposta_texto || "--"}
                </p>
              </div>
            </div>
          )}

          {/* Objeções */}
          {objecoes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Objeções Detectadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {objecoes.map((obj, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="bg-[#1c1c1c] border-gray-700 text-gray-400 text-xs"
                  >
                    {obj}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Performance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pontosFortes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-green-500 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Pontos Fortes
                </h3>
                <ul className="space-y-2">
                  {pontosFortes.slice(0, 3).map((ponto, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-gray-400 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{ponto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pontosMelhoria.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Melhorias
                </h3>
                <ul className="space-y-2">
                  {pontosMelhoria.slice(0, 3).map((ponto, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-gray-400 text-xs"
                    >
                      <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{ponto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Próximo Passo */}
          <div className="bg-blue-900/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-[9px] font-bold text-blue-400 uppercase mb-2 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" /> Ação Sugerida
            </h3>
            <p className="text-sm text-gray-300">{proximoPasso}</p>
          </div>

          {/* Detalhes da Conversão (se houver) */}
          {detalhesConversao && (
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-center">
              <p className="text-[10px] font-bold text-green-400 uppercase mb-1">
                🎉 Detalhes da Conversão
              </p>
              <p className="text-sm text-gray-300">{detalhesConversao}</p>
            </div>
          )}

          {/* Info adicional */}
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <User className="h-3 w-3" />
              <span>Responsável: {vendedor}</span>
              <span>•</span>
              <span>
                {new Date(analise.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
