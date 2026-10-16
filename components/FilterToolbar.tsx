"use client";

import {
  FilterStatus,
  SortOrder,
} from "@/lib/types";
import { Search, Eye, EyeOff, ArrowUpDown, AlertTriangle } from "lucide-react";

interface FilterToolbarProps {
  filter: FilterStatus;
  onFilterChange: (f: FilterStatus) => void;
  search: string;
  onSearchChange: (s: string) => void;
  sort: SortOrder;
  onSortChange: (s: SortOrder) => void;
  revealSecrets: boolean;
  onToggleRevealSecrets: () => void;
  counts: {
    all: number;
    locked: number;
    unlocked: number;
    missable: number;
    hidden: number;
  };
}

export default function FilterToolbar({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  sort,
  onSortChange,
  revealSecrets,
  onToggleRevealSecrets,
  counts,
}: FilterToolbarProps) {
  const tabs: { id: FilterStatus; label: string; count: number; icon?: any; color?: string }[] = [
    { id: "all", label: "Tous", count: counts.all },
    { id: "locked", label: "À faire", count: counts.locked },
    { id: "unlocked", label: "Obtenus", count: counts.unlocked },
    { id: "missable", label: "Manquables", count: counts.missable, icon: AlertTriangle, color: "text-amber-400" },
    { id: "hidden", label: "Secrets", count: counts.hidden, icon: Eye, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-3">
      {/* Search & Sort Row */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        {/* Search within achievements */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filtrer les succès (nom, description)..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition focus:border-sky-500"
          />
        </div>

        {/* Sort Selector & Reveal Secrets button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortOrder)}
              className="w-full sm:w-auto appearance-none rounded-xl border border-slate-800 bg-slate-900 py-2 pl-3 pr-8 text-xs text-slate-200 outline-none transition focus:border-sky-500"
            >
              <option value="default">Ordre Steam</option>
              <option value="rarity-asc">Rareté : Plus rare d&apos;abord</option>
              <option value="rarity-desc">Rareté : Plus commun d&apos;abord</option>
              <option value="name-asc">Nom (A - Z)</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          <button
            onClick={onToggleRevealSecrets}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
              revealSecrets
                ? "border-purple-500/50 bg-purple-500/20 text-purple-300"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
            }`}
            title={revealSecrets ? "Masquer les secrets" : "Révéler les secrets"}
          >
            {revealSecrets ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Secrets révélés</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Révéler secrets</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Tabs (Horizontal scrolling on small screens) */}
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
    </div>
  );
}
