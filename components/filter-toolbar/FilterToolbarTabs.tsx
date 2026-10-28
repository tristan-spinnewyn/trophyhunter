// components/filter-toolbar/FilterToolbarTabs.tsx

import type { ComponentType } from "react";
import { AlertTriangle, Eye, Target } from "lucide-react";
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
    pinned?: number;
  };
}

export function FilterToolbarTabs({
  filter,
  onFilterChange,
  counts,
}: FilterToolbarTabsProps) {
  const tabs: {
    id: FilterStatus;
    label: string;
    count: number;
    icon?: ComponentType<{ className?: string }>;
    color?: string;
  }[] = [
    { id: "all", label: "Tous", count: counts.all },
    { id: "locked", label: "À faire", count: counts.locked },
    { id: "unlocked", label: "Obtenus", count: counts.unlocked },
    { id: "pinned", label: "Chasse active", count: counts.pinned ?? 0, icon: Target, color: "text-amber-400" },
    { id: "missable", label: "Manquables", count: counts.missable, icon: AlertTriangle, color: "text-amber-400" },
    { id: "hidden", label: "Secrets", count: counts.hidden, icon: Eye, color: "text-purple-400" },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = filter === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange(tab.id)}
            aria-pressed={isActive}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              isActive
                ? "border-slate-700 bg-slate-800 text-white"
                : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            {Icon && <Icon className={`h-3.5 w-3.5 ${tab.color || ""}`} />}
            <span>{tab.label}</span>
            <span className="text-xs tabular-nums text-slate-500">{tab.count}</span>
          </button>
        );
      })}
    </div>
  );
}
