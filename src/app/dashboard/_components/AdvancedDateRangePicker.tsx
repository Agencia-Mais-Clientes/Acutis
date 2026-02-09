"use client";

import { useState, useCallback, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronDown, ArrowLeftRight, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  type DateRange,
  type ComparisonType,
  type PresetKey,
  getPresets,
  getComparisonPeriod,
  formatDateRangeDisplay,
} from "@/lib/date-utils";
import type { DateRange as RdpDateRange } from "react-day-picker";

interface AdvancedDateRangePickerProps {
  value?: DateRange;
  comparisonValue?: DateRange;
  compareEnabled?: boolean;
  onChange: (range: DateRange, comparison?: DateRange) => void;
  onCompareChange?: (enabled: boolean) => void;
  className?: string;
}

const comparisonOptions: { value: ComparisonType; label: string }[] = [
  { value: "previous", label: "Período anterior" },
  { value: "previousYear", label: "Mesmo período ano passado" },
];

export function AdvancedDateRangePicker({
  value,
  comparisonValue,
  compareEnabled = false,
  onChange,
  onCompareChange,
  className,
}: AdvancedDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>("thisMonth");
  const [comparisonType, setComparisonType] = useState<ComparisonType>("previous");
  const [localCompareEnabled, setLocalCompareEnabled] = useState(compareEnabled);

  const presets = useMemo(() => getPresets(), []);

  // Default to "Este mês" if no value
  const currentRange = useMemo(() => {
    if (value) return value;
    const thisMonthPreset = presets.find((p) => p.key === "thisMonth");
    return thisMonthPreset?.getValue() ?? { from: new Date(), to: new Date() };
  }, [value, presets]);

  // Convert to react-day-picker format
  const rdpRange: RdpDateRange = useMemo(
    () => ({
      from: currentRange.from,
      to: currentRange.to,
    }),
    [currentRange]
  );

  // Handle preset click
  const handlePresetClick = useCallback(
    (key: PresetKey) => {
      const preset = presets.find((p) => p.key === key);
      if (!preset) return;

      const newRange = preset.getValue();
      setSelectedPreset(key);

      const comparison = localCompareEnabled
        ? getComparisonPeriod(newRange, comparisonType)
        : undefined;

      onChange(newRange, comparison);
    },
    [presets, localCompareEnabled, comparisonType, onChange]
  );

  // Handle calendar range selection
  const handleRangeSelect = useCallback(
    (range: RdpDateRange | undefined) => {
      if (!range?.from) return;

      const newRange: DateRange = {
        from: range.from,
        to: range.to ?? range.from,
      };

      // Normalize the end time to end of day
      newRange.to.setHours(23, 59, 59, 999);
      newRange.from.setHours(0, 0, 0, 0);

      setSelectedPreset(null); // Custom range selected

      const comparison = localCompareEnabled
        ? getComparisonPeriod(newRange, comparisonType)
        : undefined;

      onChange(newRange, comparison);
    },
    [localCompareEnabled, comparisonType, onChange]
  );

  // Handle comparison toggle
  const handleCompareToggle = useCallback(() => {
    const newEnabled = !localCompareEnabled;
    setLocalCompareEnabled(newEnabled);
    onCompareChange?.(newEnabled);

    if (newEnabled) {
      const comparison = getComparisonPeriod(currentRange, comparisonType);
      onChange(currentRange, comparison);
    } else {
      onChange(currentRange, undefined);
    }
  }, [localCompareEnabled, onCompareChange, currentRange, comparisonType, onChange]);

  // Handle comparison type change
  const handleComparisonTypeChange = useCallback(
    (type: ComparisonType) => {
      setComparisonType(type);
      if (localCompareEnabled) {
        const comparison = getComparisonPeriod(currentRange, type);
        onChange(currentRange, comparison);
      }
    },
    [localCompareEnabled, currentRange, onChange]
  );

  // Handle apply button
  const handleApply = useCallback(() => {
    setOpen(false);
  }, []);

  const displayText = formatDateRangeDisplay(currentRange);
  const comparisonText = comparisonValue
    ? formatDateRangeDisplay(comparisonValue)
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between gap-2 bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-700 hover:text-white min-w-[200px] shadow-lg",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{displayText}</span>
              {localCompareEnabled && comparisonText && (
                <span className="text-xs text-cyan-200">vs {comparisonText}</span>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-auto p-0 bg-white shadow-2xl border border-gray-200 rounded-xl overflow-hidden" 
        align="end"
        sideOffset={8}
      >
        <div className="flex">
          {/* Presets Sidebar */}
          <div className="w-44 border-r border-gray-100 p-3 bg-gray-50/50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              Período
            </p>
            <div className="space-y-0.5">
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePresetClick(preset.key)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150",
                    selectedPreset === preset.key
                      ? "bg-cyan-600 text-white font-medium shadow-sm"
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Comparison Section */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleCompareToggle}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                  localCompareEnabled
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "hover:bg-gray-100 text-gray-600"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                    localCompareEnabled
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300"
                  )}
                >
                  {localCompareEnabled && <Check className="h-3 w-3 text-white" />}
                </div>
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>Comparar</span>
              </button>

              {localCompareEnabled && (
                <div className="mt-2 space-y-1 px-1">
                  {comparisonOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleComparisonTypeChange(opt.value)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded text-xs transition-colors",
                        comparisonType === opt.value
                          ? "bg-blue-100 text-blue-800 font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Calendar Area */}
          <div className="p-4">
            <Calendar
              mode="range"
              selected={rdpRange}
              onSelect={handleRangeSelect}
              numberOfMonths={2}
              className="rounded-lg"
            />

            {/* Summary Footer */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm">
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">{displayText}</span>
                </p>
                {localCompareEnabled && comparisonValue && (
                  <p className="text-gray-500 text-xs mt-0.5">
                    Comparando com: {comparisonText}
                  </p>
                )}
              </div>
              <Button
                onClick={handleApply}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
