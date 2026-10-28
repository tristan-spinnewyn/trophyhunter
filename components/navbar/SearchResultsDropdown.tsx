// components/navbar/SearchResultsDropdown.tsx

import { Loader2, Sparkles } from "lucide-react";
import type { GameSearchResult } from "@/lib/types";
import { POPULAR_GAMES } from "./popularGames";

interface DropdownProps {
  isLoading: boolean;
  results: GameSearchResult[];
  query: string;
  onPickGame: (id: number) => void;
}

export function SearchResultsDropdown({
  isLoading,
  results,
  query,
  onPickGame,
}: DropdownProps) {
  return (
    <div className="absolute left-0 right-0 top-full mt-2 max-h-[75vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900/95 p-2 backdrop-blur-xl z-50">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
          Recherche sur Steam...
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Résultats Steam
          </div>
          {results.map((g) => (
            <button
              key={g.id}
              onClick={() => onPickGame(g.id)}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-800/80 group"
            >
              <img src={g.img} alt={g.name} className="h-10 w-20 rounded-lg object-cover bg-slate-950" />
              <div className="flex-1 truncate">
                <div className="truncate text-sm font-semibold text-white group-hover:text-sky-400">
                  {g.name}
                </div>
                <div className="text-[11px] text-slate-400">AppID: {g.id}</div>
              </div>
            </button>
          ))}
        </div>
      ) : query.length >= 2 ? (
        <div className="py-6 text-center text-sm text-slate-400">
          Aucun jeu trouvé pour &quot;{query}&quot;.
        </div>
      ) : (
        <div className="space-y-2 p-1">
          <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Jeux populaires
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {POPULAR_GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => onPickGame(g.id)}
                className="flex items-center gap-2.5 rounded-xl p-2 text-left transition hover:bg-slate-800/80 group"
              >
                <img src={g.img} alt={g.name} className="h-9 w-16 rounded-md object-cover bg-slate-950" />
                <div className="truncate text-xs font-semibold text-slate-200 group-hover:text-sky-400">
                  {g.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
