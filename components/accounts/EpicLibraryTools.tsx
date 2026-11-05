// components/accounts/EpicLibraryTools.tsx

import { RefreshCw, Trash2 } from "lucide-react";

interface EpicLibraryToolsProps {
  epicCounts: { total: number; withAch: number; noAch: number };
  isSyncingEpic: boolean;
  onScanEpicAchievements: () => void;
  onCleanEpicGames: () => void;
}

/** Maintenance actions on imported Epic games: find their achievements or drop the imports. */
export function EpicLibraryTools({
  epicCounts,
  isSyncingEpic,
  onScanEpicAchievements,
  onCleanEpicGames,
}: EpicLibraryToolsProps) {
  if (epicCounts.total === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-edge bg-plank/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-dust">
        {epicCounts.total} {epicCounts.total > 1 ? "jeux Epic importés" : "jeu Epic importé"}, dont{" "}
        {epicCounts.withAch} avec succès.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {epicCounts.noAch > 0 && (
          <button
            type="button"
            disabled={isSyncingEpic}
            onClick={onScanEpicAchievements}
            className="flex items-center gap-1.5 rounded-lg border border-seam px-3 py-1.5 text-sm text-paper transition hover:bg-edge disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncingEpic ? "animate-spin" : ""}`} />
            Chercher les succès ({epicCounts.noAch})
          </button>
        )}
        <button
          type="button"
          onClick={onCleanEpicGames}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-dust transition hover:bg-edge hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
          Nettoyer les jeux Epic
        </button>
      </div>
    </div>
  );
}
