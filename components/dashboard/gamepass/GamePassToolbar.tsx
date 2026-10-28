// components/dashboard/gamepass/GamePassToolbar.tsx

import { Search, RefreshCw } from "lucide-react";
import type { GamePassFeatureFilter } from "@/lib/gamepass/gamepass.types";

interface GamePassToolbarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (val: string) => void;
  readonly categoryFilter: string;
  readonly onCategoryChange: (val: string) => void;
  readonly featureFilter: GamePassFeatureFilter;
  readonly onFeatureFilterChange: (val: GamePassFeatureFilter) => void;
  readonly categories: readonly string[];
  readonly isLoading: boolean;
  readonly onRefresh: () => void;
}

const FEATURE_FILTERS: readonly { readonly id: GamePassFeatureFilter; readonly label: string }[] = [
  { id: "all", label: "Tous les jeux" },
  { id: "achievements", label: "🏆 Succès Xbox" },
  { id: "play-anywhere", label: "💻 Play Anywhere" },
  { id: "unowned", label: "✨ Non possédés" },
  { id: "owned", label: "✅ Dans ma bibliothèque" },
];

export function GamePassToolbar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  featureFilter,
  onFeatureFilterChange,
  categories,
  isLoading,
  onRefresh,
}: GamePassToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un jeu PC Game Pass, studio ou genre..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Actualiser</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FEATURE_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => onFeatureFilterChange(f.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              featureFilter === f.id
                ? "border border-emerald-500/50 bg-emerald-500/20 text-emerald-200 shadow-sm"
                : "border border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
