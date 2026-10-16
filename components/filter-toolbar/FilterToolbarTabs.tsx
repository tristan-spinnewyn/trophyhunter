// components/filter-toolbar/FilterToolbarTabs.tsx

import { AlertTriangle, Eye } from "lucide-react";
import type { FilterStatus } from "@/lib/types";

interface FilterToolbarTabsProps {
  filter: FilterStatus;
  onFilterChange: (f: FilterStatus) => void;
  counts: {
    all: number;
    locked: number;
    unlocked: number;
    missable: number;
    hidden: number;
  };
}

export function FilterToolbarTabs({
  filter,
  onFilterChange,
  counts,
}: FilterToolbarTabsProps) {
  const tabs: { id: FilterStatus; label: string; count: number; icon?: any; color?: string }[] = [
    { id: "all", label: "Tous", count: counts.all },
    { id: "locked", label: "À faire", count: counts.locked },
    { id: "unlocked", label: "Obtenus", count: counts.unlocked },
    { id: "missable", label: "Manquables", count: counts.missable, icon: AlertTriangle, color: "text-amber-400" },
    { id: "hidden", label: "Secrets", count: counts.hidden, icon: Eye, color: "text-purple-400" },
  ];

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = filter === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              isActive
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/80"
            }`}
          >
            {Icon && <Icon className={`h-3 w-3 ${tab.color || ""}`} />}
            <span>{tab.label}</span>
            <span
              className={`rounded-md px-1.5 py-0.2 text-[10px] ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
