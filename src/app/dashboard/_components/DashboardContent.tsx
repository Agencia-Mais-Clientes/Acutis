"use client";

import { useState, useCallback, useTransition, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DashboardTabs } from "./DashboardTabs";
import { AdvancedDateRangePicker } from "./AdvancedDateRangePicker";
import { KPICardsVendas } from "./KPICardsVendas";
import { KPICardsSuporte } from "./KPICardsSuporte";
import { FunilPersonalizado } from "./FunilPersonalizado";
import { MonitorGargalos } from "./MonitorGargalos";
import { TopObjecoes } from "./TopObjecoes";
import { SlideUp } from "@/components/ui/motion";
import { 
  KPIsDashboard, 
  DadosFunil, 
  Gargalo,
  ObjecaoRanking 
} from "@/lib/types";
import { type DateRange, type PresetKey, getPresets } from "@/lib/date-utils";
import { getKPIsDashboard, getDadosFunil } from "../actions-dashboard";
import { getGargalos, getTopObjecoes } from "../actions";
import { Loader2 } from "lucide-react";

type Tab = "vendas" | "suporte";

interface DashboardContentProps {
  ownerId: string;
  // Dados iniciais (Server-side)
  initialKpis: KPIsDashboard;
  initialFunilVendas: DadosFunil[];
  initialFunilSuporte: DadosFunil[];
  initialGargalos: Gargalo[];
  initialObjecoes: ObjecaoRanking[];
}

export function DashboardContent({
  ownerId,
  initialKpis,
  initialFunilVendas,
  initialFunilSuporte,
  initialGargalos,
  initialObjecoes,
}: DashboardContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const presets = useMemo(() => getPresets(), []);
  const didInitialLoad = useRef(false);

  const [activeTab, setActiveTab] = useState<Tab>("vendas");
  const [comparisonRange, setComparisonRange] = useState<DateRange | undefined>();
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Initialize dateRange from URL or default ("thisMonth")
  const urlPreset = searchParams.get("preset") as PresetKey | null;
  const urlFrom = searchParams.get("from");
  const urlTo = searchParams.get("to");

  const initialDateRange = useMemo<DateRange | undefined>(() => {
    if (urlFrom && urlTo) {
      const from = new Date(urlFrom);
      const to = new Date(urlTo);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        return { from, to };
      }
    }
    if (urlPreset) {
      const preset = presets.find(p => p.key === urlPreset);
      if (preset) return preset.getValue();
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange);
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(urlPreset || "thisMonth");

  // Estados dos dados
  const [kpis, setKpis] = useState<KPIsDashboard>(initialKpis);
  const [funilVendas, setFunilVendas] = useState<DadosFunil[]>(initialFunilVendas);
  const [funilSuporte, setFunilSuporte] = useState<DadosFunil[]>(initialFunilSuporte);
  const [gargalos, setGargalos] = useState<Gargalo[]>(initialGargalos);
  const [objecoes, setObjecoes] = useState<ObjecaoRanking[]>(initialObjecoes);

  // Sync state with props when they change (e.g. after company switch -> router.refresh)
  useEffect(() => { setKpis(initialKpis); }, [initialKpis]);
  useEffect(() => { setFunilVendas(initialFunilVendas); }, [initialFunilVendas]);
  useEffect(() => { setFunilSuporte(initialFunilSuporte); }, [initialFunilSuporte]);
  useEffect(() => { setGargalos(initialGargalos); }, [initialGargalos]);
  useEffect(() => { setObjecoes(initialObjecoes); }, [initialObjecoes]);

  // On mount: if URL has date params, reload data with that period
  useEffect(() => {
    if (didInitialLoad.current) return;
    didInitialLoad.current = true;
    if (initialDateRange) {
      reloadData(initialDateRange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarrega dados quando muda o período
  const reloadData = useCallback(async (range: DateRange) => {
    startTransition(async () => {
      const periodo = {
        inicio: range.from.toISOString(),
        fim: range.to.toISOString(),
      };

      const [newKpis, newFunilVendas, newFunilSuporte, newGargalos, newObjecoes] = await Promise.all([
        getKPIsDashboard(ownerId, periodo),
        getDadosFunil(ownerId, "vendas", periodo),
        getDadosFunil(ownerId, "suporte", periodo),
        getGargalos(ownerId, periodo),
        getTopObjecoes(ownerId, periodo),
      ]);

      setKpis(newKpis);
      setFunilVendas(newFunilVendas);
      setFunilSuporte(newFunilSuporte);
      setGargalos(newGargalos);
      setObjecoes(newObjecoes);
    });
  }, [ownerId]);

  // Persist date range to URL
  const updateUrlParams = useCallback((range: DateRange, preset?: PresetKey | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", range.from.toISOString().split("T")[0]);
    params.set("to", range.to.toISOString().split("T")[0]);
    if (preset) {
      params.set("preset", preset);
    } else {
      params.delete("preset");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  // Handler de mudança de data
  const handleDateChange = useCallback((range: DateRange, comparison?: DateRange, preset?: PresetKey | null) => {
    setDateRange(range);
    setComparisonRange(comparison);
    if (preset !== undefined) setSelectedPreset(preset);
    reloadData(range);
    updateUrlParams(range, preset);
  }, [reloadData, updateUrlParams]);

  // Handler de mudança de comparação
  const handleCompareChange = useCallback((enabled: boolean) => {
    setCompareEnabled(enabled);
  }, []);

  return (
    <div className="space-y-6">
      {/* Filtros: Tabs + Date */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <DashboardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          contadorVendas={kpis.vendas.totalLeads}
          contadorSuporte={kpis.suporte.totalTickets}
        />
        
        <div className="flex items-center gap-3">
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
          )}
          <AdvancedDateRangePicker
            value={dateRange}
            comparisonValue={comparisonRange}
            compareEnabled={compareEnabled}
            onChange={handleDateChange}
            onCompareChange={handleCompareChange}
            initialPreset={selectedPreset}
          />
        </div>
      </div>

      {/* Conteúdo por Tab */}
      {activeTab === "vendas" ? (
        <div className="space-y-6">
          <SlideUp delay={0.1}>
            <KPICardsVendas kpis={kpis.vendas} />
          </SlideUp>

          {/* Funil + Gargalos lado a lado */}
          <SlideUp delay={0.15}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <FunilPersonalizado
                dados={funilVendas}
                titulo="Funil de Vendas"
              />
              <MonitorGargalos gargalos={gargalos} totalLeads={kpis.vendas.totalLeads} />
            </div>
          </SlideUp>

          <SlideUp delay={0.2}>
            <TopObjecoes objecoes={objecoes} />
          </SlideUp>
        </div>
      ) : (
        <div className="space-y-6">
          <SlideUp delay={0.1}>
            <KPICardsSuporte kpis={kpis.suporte} />
          </SlideUp>

          <SlideUp delay={0.15}>
            <FunilPersonalizado
              dados={funilSuporte}
              titulo="Funil de Suporte"
            />
          </SlideUp>

          <SlideUp delay={0.2}>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Suporte</h3>
              <p className="text-gray-500 text-sm">
                Tempo médio de resposta: <strong className="text-gray-900">{kpis.suporte.tempoMedioResposta}</strong>
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Taxa de resolução: <strong className="text-emerald-600">
                  {kpis.suporte.totalTickets > 0
                    ? Math.round((kpis.suporte.ticketsResolvidos / kpis.suporte.totalTickets) * 100)
                    : 0}%
                </strong>
              </p>
            </div>
          </SlideUp>
        </div>
      )}
    </div>
  );
}

