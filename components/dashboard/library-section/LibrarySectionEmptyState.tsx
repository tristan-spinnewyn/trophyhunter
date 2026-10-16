// components/dashboard/library-section/LibrarySectionEmptyState.tsx

import { Gamepad2, RefreshCw } from "lucide-react";

interface LibrarySectionEmptyStateProps {
  totalOwnedGamesCount: number;
  isSyncingSteam: boolean;
  onConnectAndSyncSteam: () => Promise<void>;
}

export function LibrarySectionEmptyState({
  totalOwnedGamesCount,
  isSyncingSteam,
  onConnectAndSyncSteam,
}: LibrarySectionEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-8 text-center space-y-3">
      <Gamepad2 className="h-8 w-8 text-slate-500 mx-auto" />
      <div className="space-y-1">
        <p className="text-sm font-bold text-white">
          {totalOwnedGamesCount === 0
            ? "Votre bibliothèque est encore vide"
            : "Aucun jeu ne correspond à ce filtre"}
        </p>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {totalOwnedGamesCount === 0
            ? "Cliquez sur « Importer Jeux & Succès » en haut avec votre SteamID pour importer automatiquement vos jeux et vos succès débloqués !"
            : "Essayez de modifier vos filtres de plateforme ou de statut."}
        </p>
      </div>
      {totalOwnedGamesCount === 0 && (
        <button
          onClick={() => onConnectAndSyncSteam()}
          disabled={isSyncingSteam}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              isSyncingSteam ? "animate-spin" : ""
            }`}
          />
          Importer mes jeux Steam maintenant
        </button>
      )}
    </div>
  );
}
