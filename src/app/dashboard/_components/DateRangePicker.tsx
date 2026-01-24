"use client";

import { useState, useCallback } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value?: { inicio: Date; fim: Date };
  onChange: (range: { inicio: Date; fim: Date }) => void;
  className?: string;
}

type PresetKey = "hoje" | "7dias" | "30dias" | "mes" | "mesPassado";

interface Preset {
  label: string;
  getValue: () => { inicio: Date; fim: Date };
}

const presets: Record<PresetKey, Preset> = {
  hoje: {
    label: "Hoje",
    getValue: () => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const fimHoje = new Date();
      fimHoje.setHours(23, 59, 59, 999);
      return { inicio: hoje, fim: fimHoje };
    },
  },
  "7dias": {
    label: "Últimos 7 dias",
    getValue: () => {
      const fim = new Date();
      fim.setHours(23, 59, 59, 999);
      const inicio = new Date();
      inicio.setDate(inicio.getDate() - 7);
      inicio.setHours(0, 0, 0, 0);
      return { inicio, fim };
    },
  },
  "30dias": {
    label: "Últimos 30 dias",
    getValue: () => {
      const fim = new Date();
      fim.setHours(23, 59, 59, 999);
      const inicio = new Date();
      inicio.setDate(inicio.getDate() - 30);
      inicio.setHours(0, 0, 0, 0);
      return { inicio, fim };
    },
  },
  mes: {
    label: "Este mês",
    getValue: () => {
      const hoje = new Date();
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date();
      fim.setHours(23, 59, 59, 999);
      return { inicio, fim };
    },
  },
  mesPassado: {
    label: "Mês passado",
    getValue: () => {
      const hoje = new Date();
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      fim.setHours(23, 59, 59, 999);
      return { inicio, fim };
    },
  },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("mes");

  // Se não tiver valor, usa mês atual como padrão
  const currentRange = value || presets.mes.getValue();

  const handlePresetClick = useCallback((key: PresetKey) => {
    const newRange = presets[key].getValue();
    setSelectedPreset(key);
    onChange(newRange);
    setOpen(false);
  }, [onChange]);

  const displayText = `${formatDate(currentRange.inicio)} - ${formatDate(currentRange.fim)}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white min-w-[180px]",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">{displayText}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          {(Object.entries(presets) as [PresetKey, Preset][]).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handlePresetClick(key)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                selectedPreset === key
                  ? "bg-violet-100 text-violet-900 font-medium"
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        
        <div className="border-t mt-2 pt-2">
          <p className="text-xs text-muted-foreground px-3 py-1">
            Período selecionado:
          </p>
          <p className="text-sm font-medium px-3 text-gray-900">
            {displayText}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
