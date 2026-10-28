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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-sky-500/30 bg-sky-950/30 p-3.5 text-xs">
      <div className="flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-sky-200">
            Steam indique que vous possédez {steamAccount.stats.gamesOwned} jeux ({totalOwnedGamesCount} jeux publics synchronisés).
          </p>
          <p className="text-[11px] text-slate-400">
            Valve restreint la liste complète des jeux possédés aux requêtes authentifiées. Pour importer l&apos;ensemble de vos {steamAccount.stats.gamesOwned} jeux d&apos;un coup, ajoutez votre clé API Steam gratuite ci-dessus ou collez-les via l&apos;import en masse.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onAddApiKeyClick}
          className="rounded-xl border border-sky-500/40 bg-sky-500/20 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30 transition"
        >
          Ajouter clé API
        </button>
        <button
          onClick={onOpenAddGame}
          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
        >
          Import en masse
        </button>
      </div>
    </div>
  );
}
