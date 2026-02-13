"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DadosFunil } from "@/lib/types";
import { type DateRange, type PresetKey } from "@/lib/date-utils";
import { TrendingUp, XCircle } from "lucide-react";

interface FunilPersonalizadoProps {
  dados: DadosFunil[];
  titulo?: string;
  dateRange?: DateRange;
  selectedPreset?: PresetKey | null;
}

function getFilterParam(etapaNome: string): string {
  const nome = etapaNome.toLowerCase();
  if (nome.includes("lead") || nome.includes("recebido") || nome.includes("ticket")) return "todos";
  if (nome.includes("qualificado") || nome.includes("negociação") || nome.includes("negociacao")) return "NEGOCIACAO";
  if (nome.includes("agendado")) return "AGENDADO";
  if (nome.includes("convertido") || nome.includes("vendido") || nome.includes("matriculado")) return "VENDIDO";
  if (nome.includes("resolvido")) return "RESOLVIDO";
  if (nome.includes("atendimento")) return "EM_ATENDIMENTO";
  if (nome.includes("perdido")) return "PERDIDO";
  return "todos";
}

const FINAL_WIDTH_PCT = 30;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function FunilPersonalizado({
  dados,
  titulo = "Funil de Conversão",
  dateRange,
  selectedPreset,
}: FunilPersonalizadoProps) {
  const buildHref = (filterParam: string) => {
    const params = new URLSearchParams();
    if (filterParam !== "todos") params.set("fase", filterParam);
    if (dateRange?.from) params.set("from", dateRange.from.toISOString().split("T")[0]);
    if (dateRange?.to) params.set("to", dateRange.to.toISOString().split("T")[0]);
    if (selectedPreset) params.set("preset", selectedPreset);
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

  const dadosOrdenados = [...dados]
    .sort((a, b) => a.etapa.ordem - b.etapa.ordem)
    .filter((d) => !d.etapa.nome.toLowerCase().includes("perdido"));

  const perdidos = dados.find((d) => d.etapa.nome.toLowerCase().includes("perdido"));
  const total = dadosOrdenados[0]?.quantidade || 1;
  const n = dadosOrdenados.length;

  const convertidos = dadosOrdenados.find(
    (d) =>
      d.etapa.nome.toLowerCase().includes("convertido") ||
      d.etapa.nome.toLowerCase().includes("resolvido")
  );
  const taxaConversao =
    total > 0 && convertidos ? Math.round((convertidos.quantidade / total) * 100) : 0;

  const getStageWidth = (index: number) => {
    if (n <= 1) return 100;
    return 100 - (index * (100 - FINAL_WIDTH_PCT)) / (n - 1);
  };

  const BAND_HEIGHT = 52;
  const GAP = 5;
  const lastStageCor = dadosOrdenados[n - 1]?.etapa.cor || "#6366f1";
  const lastStageWidth = getStageWidth(n - 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-gray-900">{titulo}</h3>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700">{taxaConversao}%</span>
          <span className="text-xs text-emerald-600">conversão</span>
        </div>
      </div>

      {/* Funnel layout: shape left + labels right */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {dadosOrdenados.map((item, index) => {
          const isFirst = index === 0;
          const filterParam = getFilterParam(item.etapa.nome);
          const href = buildHref(filterParam);
          const bandWidth = getStageWidth(index);

          return (
            <motion.div key={item.etapa.id} variants={rowVariants}>
              <Link
                href={href}
                className="group flex items-center gap-0 transition-colors rounded-lg hover:bg-gray-50/80"
                title={`Ver ${item.quantidade} leads em "${item.etapa.nome}"`}
                style={{ marginBottom: `${GAP}px` }}
              >
                {/* Funnel band area */}
                <div className="w-[45%] sm:w-[50%] flex justify-center shrink-0">
                  <div
                    className="rounded-lg transition-all duration-200 group-hover:shadow-lg"
                    style={{
                      width: `${bandWidth}%`,
                      height: `${BAND_HEIGHT}px`,
                      background: `linear-gradient(135deg, ${item.etapa.cor}ee, ${item.etapa.cor})`,
                      boxShadow: `0 2px 8px ${item.etapa.cor}25`,
                    }}
                  />
                </div>

                {/* Connecting line */}
                <div className="w-6 sm:w-10 flex items-center shrink-0">
                  <div
                    className="w-full border-t-2 border-dashed"
                    style={{ borderColor: `${item.etapa.cor}40` }}
                  />
                </div>

                {/* Label */}
                <div className="flex-1 flex items-center justify-between min-w-0 pr-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.etapa.cor }}
                    />
                    <span className="text-sm font-semibold text-gray-700 truncate">
                      {item.etapa.nome}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span
                      className="text-2xl font-extrabold"
                      style={{ color: item.etapa.cor }}
                    >
                      {item.quantidade}
                    </span>
                    {!isFirst && (
                      <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {item.percentual}%
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}

        {/* Funnel tip */}
        <motion.div variants={rowVariants} className="flex">
          <div className="w-[45%] sm:w-[50%] flex justify-center shrink-0">
            <div
              style={{
                width: `${lastStageWidth}%`,
                height: "44px",
                clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
                background: `linear-gradient(180deg, ${lastStageCor}ee, ${lastStageCor}55)`,
              }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Perdidos */}
      {perdidos && perdidos.quantidade > 0 && (
        <Link
          href={buildHref("PERDIDO")}
          className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-100 group hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 rounded-xl border border-red-100 shadow-sm">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-bold text-red-700">
              {perdidos.quantidade} Perdidos
            </span>
            <span className="text-xs text-red-500 font-semibold">
              ({total > 0 ? Math.round((perdidos.quantidade / total) * 100) : 0}%)
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
