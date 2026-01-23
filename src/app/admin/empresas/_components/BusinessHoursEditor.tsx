"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Clock, Sun, Moon } from "lucide-react";
import type { HorarioFuncionamento, DiaSemana, HorarioDia } from "@/lib/analyze-types";
import { HORARIO_FUNCIONAMENTO_DEFAULT } from "@/lib/analyze-types";

interface BusinessHoursEditorProps {
  value: HorarioFuncionamento;
  onChange: (value: HorarioFuncionamento) => void;
  timezone?: string;
  onTimezoneChange?: (tz: string) => void;
}

// Labels em português para os dias da semana
const DIAS_LABELS: Record<DiaSemana, string> = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo",
};

// Ordem dos dias para exibição
const DIAS_ORDEM: DiaSemana[] = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
];

// Timezones mais comuns no Brasil
const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "São Paulo (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
  { value: "America/Cuiaba", label: "Cuiabá (GMT-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
];

export function BusinessHoursEditor({
  value,
  onChange,
  timezone = "America/Sao_Paulo",
  onTimezoneChange,
}: BusinessHoursEditorProps) {
  const [localValue, setLocalValue] = useState<HorarioFuncionamento>(
    value || HORARIO_FUNCIONAMENTO_DEFAULT
  );

  // Atualiza um dia específico
  function updateDay(dia: DiaSemana, updates: Partial<HorarioDia>) {
    const newValue = {
      ...localValue,
      [dia]: {
        ...localValue[dia],
        ...updates,
      },
    };
    setLocalValue(newValue);
    onChange(newValue);
  }

  // Toggle ativo/inativo do dia
  function toggleDia(dia: DiaSemana) {
    const isActive = !localValue[dia].ativo;
    updateDay(dia, {
      ativo: isActive,
      // Se ativar e não tinha horário, coloca default
      inicio: isActive && !localValue[dia].inicio ? "08:00" : localValue[dia].inicio,
      fim: isActive && !localValue[dia].fim ? "18:00" : localValue[dia].fim,
    });
  }

  // Presets rápidos
  function applyPreset(preset: "comercial" | "academia" | "clinica") {
    let newValue: HorarioFuncionamento;
    
    switch (preset) {
      case "comercial":
        newValue = {
          segunda: { inicio: "08:00", fim: "18:00", ativo: true },
          terca: { inicio: "08:00", fim: "18:00", ativo: true },
          quarta: { inicio: "08:00", fim: "18:00", ativo: true },
          quinta: { inicio: "08:00", fim: "18:00", ativo: true },
          sexta: { inicio: "08:00", fim: "18:00", ativo: true },
          sabado: { inicio: null, fim: null, ativo: false },
          domingo: { inicio: null, fim: null, ativo: false },
        };
        break;
      case "academia":
        newValue = {
          segunda: { inicio: "06:00", fim: "22:00", ativo: true },
          terca: { inicio: "06:00", fim: "22:00", ativo: true },
          quarta: { inicio: "06:00", fim: "22:00", ativo: true },
          quinta: { inicio: "06:00", fim: "22:00", ativo: true },
          sexta: { inicio: "06:00", fim: "22:00", ativo: true },
          sabado: { inicio: "08:00", fim: "14:00", ativo: true },
          domingo: { inicio: "08:00", fim: "12:00", ativo: true },
        };
        break;
      case "clinica":
        newValue = {
          segunda: { inicio: "08:00", fim: "19:00", ativo: true },
          terca: { inicio: "08:00", fim: "19:00", ativo: true },
          quarta: { inicio: "08:00", fim: "19:00", ativo: true },
          quinta: { inicio: "08:00", fim: "19:00", ativo: true },
          sexta: { inicio: "08:00", fim: "19:00", ativo: true },
          sabado: { inicio: "08:00", fim: "13:00", ativo: true },
          domingo: { inicio: null, fim: null, ativo: false },
        };
        break;
    }
    
    setLocalValue(newValue);
    onChange(newValue);
  }

  return (
    <Card className="bg-white border border-gray-100 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 px-6 py-4">
        <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Horário de Funcionamento
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {/* Presets */}
        <div>
          <label className="block text-xs text-gray-500 mb-2 uppercase font-bold">
            ⚡ Aplicar Preset
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset("comercial")}
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              🏢 Comercial (Seg-Sex 8h-18h)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("academia")}
              className="px-3 py-1.5 text-xs rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"
            >
              💪 Academia (6h-22h, Sáb/Dom)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("clinica")}
              className="px-3 py-1.5 text-xs rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-700 transition-colors"
            >
              💆 Clínica (8h-19h, Sábado)
            </button>
          </div>
        </div>

        {/* Grid de dias */}
        <div className="space-y-3">
          {DIAS_ORDEM.map((dia) => {
            const config = localValue[dia];
            const isWeekend = dia === "sabado" || dia === "domingo";
            
            return (
              <div
                key={dia}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  config.ativo
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50 border border-gray-200 opacity-60"
                }`}
              >
                {/* Switch */}
                <Switch
                  checked={config.ativo}
                  onCheckedChange={() => toggleDia(dia)}
                  className="data-[state=checked]:bg-blue-600"
                />
                
                {/* Nome do dia */}
                <div className="flex items-center gap-2 min-w-[140px]">
                  {isWeekend ? (
                    <Moon className="h-4 w-4 text-indigo-500" />
                  ) : (
                    <Sun className="h-4 w-4 text-amber-500" />
                  )}
                  <span className={`text-sm font-medium ${config.ativo ? "text-gray-900" : "text-gray-500"}`}>
                    {DIAS_LABELS[dia]}
                  </span>
                </div>
                
                {/* Horários */}
                {config.ativo ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={config.inicio || "08:00"}
                      onChange={(e) => updateDay(dia, { inicio: e.target.value })}
                      className="w-28 text-center bg-white border-blue-200 text-sm"
                    />
                    <span className="text-gray-400">até</span>
                    <Input
                      type="time"
                      value={config.fim || "18:00"}
                      onChange={(e) => updateDay(dia, { fim: e.target.value })}
                      className="w-28 text-center bg-white border-blue-200 text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Fechado</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Timezone */}
        {onTimezoneChange && (
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-xs text-gray-500 mb-2 uppercase font-bold">
              🌍 Fuso Horário
            </label>
            <select
              value={timezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1.5">
              Define o fuso horário para cálculo correto do tempo de resposta
            </p>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
          <p className="font-medium mb-1">💡 Como funciona o tempo justo?</p>
          <p className="text-blue-700 text-xs">
            Se um lead mandar mensagem fora do expediente (ex: domingo), o tempo de resposta
            será calculado a partir da próxima abertura. Assim, vendedores não são penalizados
            por mensagens recebidas de madrugada ou finais de semana.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
