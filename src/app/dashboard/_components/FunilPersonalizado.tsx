"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DadosFunil } from "@/lib/types";
import { TrendingUp } from "lucide-react";

interface FunilPersonalizadoProps {
  dados: DadosFunil[];
  titulo?: string;
}

// Mapeia nome da etapa para query param
function getFilterParam(etapaNome: string): string {
  const nome = etapaNome.toLowerCase();
  if (nome.includes("lead") || nome.includes("recebido") || nome.includes("ticket")) return "todos";
  if (nome.includes("qualificado") || nome.includes("negociação") || nome.includes("negociacao")) return "qualificado";
  if (nome.includes("agendado") || nome.includes("atendimento")) return "agendado";
  if (nome.includes("convertido") || nome.includes("vendido") || nome.includes("matriculado") || nome.includes("resolvido")) return "convertido";
  if (nome.includes("perdido")) return "perdido";
  return "todos";
}

export function FunilPersonalizado({ dados, titulo = "Funil de Conversão" }: FunilPersonalizadoProps) {
  const searchParams = useSearchParams();
  
  // Preserva from/to/preset do dashboard para a página de análises
  const buildHref = (filterParam: string) => {
    const params = new URLSearchParams();
    if (filterParam !== "todos") params.set("fase", filterParam);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const preset = searchParams.get("preset");
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (preset) params.set("preset", preset);
    const qs = params.toString();
    return `/dashboard/analises${qs ? `?${qs}` : ""}`;
  };
  if (!dados || dados.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{titulo}</h3>
        <p className="text-gray-500 text-sm">Nenhum dado disponível.</p>
      </div>
    );
  }

  // Ordena e filtra etapa "Perdido" para não aparecer no funil visual
  const dadosOrdenados = [...dados]
    .sort((a, b) => a.etapa.ordem - b.etapa.ordem)
    .filter(d => !d.etapa.nome.toLowerCase().includes("perdido"));
  
  const perdidos = dados.find(d => d.etapa.nome.toLowerCase().includes("perdido"));
  const total = dadosOrdenados[0]?.quantidade || 1;

  // Calcula taxa de conversão geral (Convertido / Total)
  const convertidos = dadosOrdenados.find(d => 
    d.etapa.nome.toLowerCase().includes("convertido") || 
    d.etapa.nome.toLowerCase().includes("resolvido")
  );
  const taxaConversao = total > 0 && convertidos 
    ? Math.round((convertidos.quantidade / total) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">{titulo}</h3>
        <div className="flex items-center gap-1.5 text-xs">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-gray-500">Conversão:</span>
          <span className="font-bold text-emerald-600">{taxaConversao}%</span>
        </div>
      </div>
      
      {/* Funil Horizontal Compacto - Clicável */}
      <div className="flex items-stretch gap-1 mb-3 overflow-x-auto pb-2 -mx-2 px-2 md:overflow-visible md:pb-0 md:px-0 scrollbar-hide">
        {dadosOrdenados.map((item, index) => {
          const isLast = index === dadosOrdenados.length - 1;
          const filterParam = getFilterParam(item.etapa.nome);
          const href = buildHref(filterParam);

          return (
            <Link 
              key={item.etapa.id} 
              href={href}
              className="flex-1 relative group cursor-pointer min-w-[100px] md:min-w-0 flex-shrink-0"
              title={`Ver ${item.quantidade} leads em "${item.etapa.nome}"`}
            >
              {/* Barra com arrow shape */}
              <div 
                className="relative h-14 flex items-center justify-center transition-all duration-200 group-hover:scale-[1.03] group-hover:brightness-110"
                style={{
                  background: `linear-gradient(135deg, ${item.etapa.cor}ee, ${item.etapa.cor})`,
                  clipPath: isLast 
                    ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 8px 50%)'
                    : 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%)',
                  marginLeft: index === 0 ? 0 : '-8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {/* Conteúdo */}
                <div className="text-center px-2 z-10">
                  <div className="text-white font-bold text-lg leading-none">
                    {item.quantidade}
                  </div>
                  <div className="text-white/80 text-[10px] font-medium leading-tight mt-0.5 truncate max-w-[60px]">
                    {item.etapa.nome}
                  </div>
                </div>
                
                {/* Brilho */}
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 50%)',
                    clipPath: 'inherit',
                  }}
                />
              </div>
              
              {/* Taxa de conversão entre etapas */}
              {!isLast && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded font-medium shadow-lg">
                    {dadosOrdenados[index + 1] && item.quantidade > 0
                      ? Math.round((dadosOrdenados[index + 1].quantidade / item.quantidade) * 100)
                      : 0}%
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Legenda compacta - Clicável */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-gray-100 gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {dadosOrdenados.map((item) => {
            const filterParam = getFilterParam(item.etapa.nome);
            const href = filterParam === "todos" 
              ? "/dashboard/analises" 
              : `/dashboard/analises?fase=${filterParam}`;
            
            return (
              <Link 
                key={item.etapa.id} 
                href={href}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: item.etapa.cor }}
                />
                <span className="text-[11px] text-gray-500">
                  {item.etapa.nome}: <strong className="text-gray-700">{item.percentual}%</strong>
                </span>
              </Link>
            );
          })}
        </div>
        
        {/* Perdidos - Clicável */}
        {perdidos && perdidos.quantidade > 0 && (
          <Link 
            href={buildHref("perdido")}
            className="flex items-center gap-1.5 text-[11px] hover:opacity-70 transition-opacity"
          >
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-500">
              Perdidos: <strong className="text-red-600">{perdidos.quantidade}</strong>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
