// components/library/LibraryGlobalStatsGrid.tsx

import { Gamepad2, CheckCircle2, Trophy, Award, Sparkles } from "lucide-react";
import type { GlobalDashboardStats } from "@/components/dashboard/hooks/useDashboardStats.types";

interface LibraryGlobalStatsGridProps {
  readonly ownedGamesCount: number;
  readonly globalStats: GlobalDashboardStats;
}

export function LibraryGlobalStatsGrid({
  ownedGamesCount,
  globalStats,
}: LibraryGlobalStatsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
      <div className="flex items-center justify-between rounded-2xl border border-slate-800/90 bg-slate-950/60 px-4 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Jeux Suivis
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
            {ownedGamesCount}
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
          <Gamepad2 className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-teal-500/25 bg-teal-950/15 px-4 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-300/90">
            Jeux Terminés
          </div>
          <div className="text-xl sm:text-2xl font-black text-teal-400 mt-0.5">
            {globalStats.finishedGamesPercent}%{" "}
            <span className="text-xs font-normal text-slate-400">
              ({globalStats.finishedGamesCount}/{ownedGamesCount})
            </span>
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400">
          <CheckCircle2 className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-amber-500/25 bg-amber-950/15 px-4 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/90">
            Platines / 100%
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
            {globalStats.totalCompletedGames}
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
          <Trophy className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-emerald-500/25 bg-emerald-950/15 px-4 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90">
            Succès Débloqués
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
            {globalStats.totalAchievementsUnlocked}
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <Award className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-purple-500/25 bg-purple-950/15 px-4 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-300/90">
            Complétion Moy.
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-300 mt-0.5">
            {globalStats.avgCompletion}%
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
