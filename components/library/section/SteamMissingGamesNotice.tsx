// components/library/section/SteamMissingGamesNotice.tsx

import { Sparkles } from "lucide-react";
import type { UserAccountProfile } from "@/lib/types";

interface SteamMissingGamesNoticeProps {
  steamAccount: UserAccountProfile["accounts"]["steam"];
  totalOwnedGamesCount: number;
  onAddApiKeyClick: () => void;
  onOpenAddGame: () => void;
}

export function SteamMissingGamesNotice({
  steamAccount,
  totalOwnedGamesCount,
  onAddApiKeyClick,
  onOpenAddGame,
}: SteamMissingGamesNoticeProps) {
  if (!steamAccount || steamAccount.stats.gamesOwned <= totalOwnedGamesCount) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-sheet border border-lamp/30 bg-lamp/30 p-3.5 text-xs">
      <div className="flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-lamp-bright shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-lamp-bright">
            Steam indique que vous possédez {steamAccount.stats.gamesOwned} jeux ({totalOwnedGamesCount} jeux publics synchronisés).
          </p>
          <p className="text-[11px] text-dust">
            Valve restreint la liste complète des jeux possédés aux requêtes authentifiées. Pour importer l&apos;ensemble de vos {steamAccount.stats.gamesOwned} jeux d&apos;un coup, ajoutez votre clé API Steam gratuite ci-dessus ou collez-les via l&apos;import en masse.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onAddApiKeyClick}
          className="rounded-control border border-lamp/40 bg-lamp/20 px-3 py-1.5 text-xs font-bold text-lamp-bright hover:bg-lamp/30 transition"
        >
          Ajouter clé API
        </button>
        <button
          onClick={onOpenAddGame}
          className="rounded-control border border-seam bg-edge px-3 py-1.5 text-xs font-medium text-paper-dim hover:bg-seam transition"
        >
          Import en masse
        </button>
      </div>
    </div>
  );
}
