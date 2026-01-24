"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, Headphones } from "lucide-react";

type Tab = "vendas" | "suporte";

interface DashboardTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  contadorVendas?: number;
  contadorSuporte?: number;
}

const tabs: { id: Tab; label: string; icon: typeof TrendingUp; color: string }[] = [
  {
    id: "vendas",
    label: "Vendas",
    icon: TrendingUp,
    color: "violet",
  },
  {
    id: "suporte",
    label: "Suporte",
    icon: Headphones,
    color: "blue",
  },
];

export function DashboardTabs({ 
  activeTab, 
  onTabChange,
  contadorVendas = 0,
  contadorSuporte = 0,
}: DashboardTabsProps) {
  const contadores = {
    vendas: contadorVendas,
    suporte: contadorSuporte,
  };

  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const contador = contadores[tab.id];

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
              isActive
                ? tab.id === "vendas"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                  : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                : "text-gray-600 hover:bg-white hover:shadow-sm"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {contador > 0 && (
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-bold rounded-full",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-600"
                )}
              >
                {contador}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
