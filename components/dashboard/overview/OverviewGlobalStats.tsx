// components/dashboard/overview/OverviewGlobalStats.tsx

import { Gamepad2, Trophy, Award, Sparkles } from "lucide-react";
import type { UserAccountProfile } from "@/lib/types";

interface OverviewGlobalStatsProps {
  globalStats: {
    totalGamesOwned: number;
    trackedGamesCount: number;
    totalCompletedGames: number;
    totalAchievementsUnlocked: number;
    connectedCount: number;
    avgCompletion: number;
  };
  steamAccount?: UserAccountProfile["accounts"]["steam"];
}

export function OverviewGlobalStats({
  globalStats,
  steamAccount,
}: OverviewGlobalStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold">Jeux Possédés</span>
          <Gamepad2 className="h-4 w-4 text-sky-400" />
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white">
          {globalStats.totalGamesOwned}
        </div>
        <div className="text-[11px] text-slate-400">
          Dont {globalStats.trackedGamesCount} dans la bibliothèque active
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-900 p-4 space-y-1">
        <div className="flex items-center justify-between text-xs text-amber-300">
          <span className="font-semibold">Platines / 100%</span>
          <Trophy className="h-4 w-4 text-amber-400" />
        </div>
        <div className="text-2xl sm:text-3xl font-black text-amber-400">
          {globalStats.totalCompletedGames}
        </div>
        <div className="text-[11px] text-slate-400">
          Jeux terminés à 100% tous comptes
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/25 to-slate-900 p-4 space-y-1">
        <div className="flex items-center justify-between text-xs text-emerald-300">
          <span className="font-semibold">Succès & Trophées</span>
          <Award className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="text-2xl sm:text-3xl font-black text-emerald-400">
          {globalStats.totalAchievementsUnlocked}
        </div>
        <div className="text-[11px] text-slate-400">
          Débloqués sur {globalStats.connectedCount || 1} plateforme(s)
        </div>
      </div>

      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/25 to-slate-900 p-4 space-y-1">
        <div className="flex items-center justify-between text-xs text-purple-300">
          <span className="font-semibold">Complétion Moyenne</span>
          <Sparkles className="h-4 w-4 text-purple-400" />
        </div>
        <div className="text-2xl sm:text-3xl font-black text-purple-300">
          {globalStats.avgCompletion}%
        </div>
        <div className="text-[11px] text-slate-400">
          {steamAccount?.stats.badges
            ? `${steamAccount.stats.badges} Badges Steam • ${
                steamAccount.stats.dlcCount || 0
              } DLC`
            : "Sur vos jeux suivis"}
        </div>
      </div>
    </div>
  );
}
