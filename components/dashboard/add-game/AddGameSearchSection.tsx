// components/dashboard/add-game/AddGameSearchSection.tsx

import { Search, Loader2 } from "lucide-react";
import type { GameSearchResult, OwnedGame, PlatformType } from "@/lib/types";

interface AddGameSearchSectionProps {
  selectedPlatformForAdd: PlatformType;
  addGameQuery: string;
  handleSearchAddGame: (val: string) => void;
  isSearchingAdd: boolean;
  addGameResults: GameSearchResult[];
  ownedGames: OwnedGame[];
  handleAddGameToLibrary: (item: GameSearchResult) => void;
}

export function AddGameSearchSection({
  selectedPlatformForAdd,
  addGameQuery,
  handleSearchAddGame,
  isSearchingAdd,
  addGameResults,
  ownedGames,
  handleAddGameToLibrary,
}: AddGameSearchSectionProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-300">
        2. Chercher et ajouter un jeu en 1 clic :
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={addGameQuery}
          onChange={(e) => handleSearchAddGame(e.target.value)}
          placeholder="Ex: Elden Ring, God of War, Hades..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-sky-500"
        />
      </div>

      {isSearchingAdd && (
        <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
          Recherche en cours...
        </div>
      )}

      {addGameResults.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-slate-800 bg-slate-950 p-1.5">
          {addGameResults.map((item) => {
            const alreadyOwned = ownedGames.some(
              (g) =>
                g.appId === item.id &&
                g.platform === selectedPlatformForAdd
            );
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg p-1.5 hover:bg-slate-900"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="h-8 w-14 rounded object-cover bg-slate-800 shrink-0"
                  />
                  <span className="truncate text-xs font-medium text-white">
                    {item.name}
                  </span>
                </div>
                <button
                  onClick={() => handleAddGameToLibrary(item)}
                  disabled={alreadyOwned}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    alreadyOwned
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-sky-500 text-slate-950 hover:bg-sky-400"
                  }`}
                >
                  {alreadyOwned ? "✓ Possédé" : "+ Ajouter"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
