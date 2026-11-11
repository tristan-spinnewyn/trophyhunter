// components/library/add-game/AddGameSearchSection.tsx

import { Search, Loader2 } from "lucide-react";
import type { GameSearchResult, OwnedGame, PlatformType } from "@/lib/types";
import { isManualPlatform } from "@/lib/platforms";
import { manualGameId } from "@/lib/game/manual-game";

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
  const typedTitle = addGameQuery.trim();
  // Consoles and physical copies have no store to search: the title is enough.
  const canAddAsTyped = isManualPlatform(selectedPlatformForAdd) && typedTitle.length > 0;

  return (
    <div className="space-y-2">
      <label htmlFor="add-game-search" className="text-sm font-medium text-paper-dim">
        Rechercher un jeu
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          id="add-game-search"
          type="text"
          value={addGameQuery}
          onChange={(e) => handleSearchAddGame(e.target.value)}
          placeholder="Elden Ring, Hades…"
          className="w-full rounded-control border border-seam bg-ink py-2 pl-9 pr-3 text-sm text-paper outline-none focus:border-lamp"
        />
      </div>

      {isSearchingAdd && (
        <div className="flex items-center gap-2 py-2 text-xs text-dust">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-lamp-bright" />
          Recherche en cours...
        </div>
      )}

      {addGameResults.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-1 rounded-control border border-edge bg-ink p-1.5">
          {addGameResults.map((item) => {
            const alreadyOwned = ownedGames.some(
              (g) =>
                g.appId === item.id &&
                g.platform === selectedPlatformForAdd
            );
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-control p-1.5 hover:bg-plank"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="h-8 w-14 rounded object-cover bg-edge shrink-0"
                  />
                  <span className="truncate text-xs font-medium text-paper">
                    {item.name}
                  </span>
                </div>
                <button
                  onClick={() => handleAddGameToLibrary(item)}
                  disabled={alreadyOwned}
                  className={`shrink-0 rounded-control px-2.5 py-1 text-[11px] font-bold transition ${
                    alreadyOwned
                      ? "bg-done/20 text-done"
                      : "bg-lamp text-ink hover:bg-lamp-bright"
                  }`}
                >
                  {alreadyOwned ? "✓ Possédé" : "+ Ajouter"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {canAddAsTyped && (
        <button
          type="button"
          onClick={() => handleAddGameToLibrary({ id: manualGameId(typedTitle), name: typedTitle, img: "" })}
          className="w-full rounded-control border border-seam px-3 py-2 text-left text-sm font-semibold text-paper transition hover:bg-edge"
        >
          Ajouter « {typedTitle} » tel quel
        </button>
      )}
    </div>
  );
}
