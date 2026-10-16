// components/filter-toolbar/FilterToolbarControls.tsx

import { Search, Eye, EyeOff, ArrowUpDown } from "lucide-react";
import type { SortOrder } from "@/lib/types";

interface FilterToolbarControlsProps {
  search: string;
  onSearchChange: (s: string) => void;
  sort: SortOrder;
  onSortChange: (s: SortOrder) => void;
  revealSecrets: boolean;
  onToggleRevealSecrets: () => void;
}

export function FilterToolbarControls({
  search,
  onSearchChange,
  sort,
  onSortChange,
  revealSecrets,
  onToggleRevealSecrets,
}: FilterToolbarControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-2">
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
  );
}
