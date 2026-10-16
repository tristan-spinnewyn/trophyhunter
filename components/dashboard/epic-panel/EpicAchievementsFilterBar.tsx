// components/dashboard/epic-panel/EpicAchievementsFilterBar.tsx

import { Sparkles, Trophy, RefreshCw, Trash2 } from "lucide-react";

interface EpicAchievementsFilterBarProps {
  epicCounts: { total: number; withAch: number; noAch: number };
  libAchievementFilter: "all" | "with-achievements" | "no-achievements";
  setLibAchievementFilter: (val: "all" | "with-achievements" | "no-achievements") => void;
  isSyncingEpic: boolean;
  onScanEpicAchievements: () => void;
  onCleanEpicGames: () => void;
}

export function EpicAchievementsFilterBar({
  epicCounts,
  libAchievementFilter,
  setLibAchievementFilter,
  isSyncingEpic,
  onScanEpicAchievements,
  onCleanEpicGames,
}: EpicAchievementsFilterBarProps) {
  return (
    <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <Sparkles className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-purple-200">
            Tri & Filtrage des succès Epic Games
          </p>
          <p className="text-[11px] text-slate-300">
            Sur l&apos;Epic Games Store, certains jeux intègrent les <strong>Succès Epic Games</strong> (avec points XP et Trophée Platine), tandis que d&apos;autres n&apos;en ont pas. Utilisez ces filtres rapides pour isoler les jeux avec succès :
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-purple-500/20">
        <button
          onClick={() => setLibAchievementFilter("all")}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            libAchievementFilter === "all"
              ? "bg-purple-500 text-slate-950 shadow-md"
              : "border border-slate-800 bg-slate-950 text-slate-300 hover:text-white"
          }`}
        >
          Tous les jeux Epic ({epicCounts.total})
        </button>
        <button
          onClick={() => setLibAchievementFilter("with-achievements")}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
            libAchievementFilter === "with-achievements"
              ? "bg-purple-500 text-slate-950 shadow-md"
              : "border border-purple-500/40 bg-purple-950/60 text-purple-300 hover:bg-purple-900/60"
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          Avec succès Epic XP uniquement ({epicCounts.withAch})
        </button>
        <button
          onClick={() => setLibAchievementFilter("no-achievements")}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            libAchievementFilter === "no-achievements"
              ? "bg-slate-700 text-white shadow-md"
              : "border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
          }`}
        >
          Sans succès ({epicCounts.noAch})
        </button>
        {epicCounts.total > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {epicCounts.noAch > 0 && (
              <button
                type="button"
                disabled={isSyncingEpic}
                onClick={onScanEpicAchievements}
                className="rounded-xl border border-purple-500/40 bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-200 hover:bg-purple-500/30 disabled:opacity-50 transition flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isSyncingEpic ? "animate-spin" : ""}`}
                />
                Scanner les succès ({epicCounts.noAch})
              </button>
            )}
            <button
              type="button"
              onClick={onCleanEpicGames}
              className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/40 hover:text-rose-200 transition flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Nettoyer les jeux Epic ({epicCounts.total})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
