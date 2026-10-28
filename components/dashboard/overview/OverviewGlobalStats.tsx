// components/dashboard/overview/OverviewGlobalStats.tsx

import { Gamepad2, CheckCircle2, Trophy, Award, Sparkles } from "lucide-react";
import type { UserAccountProfile } from "@/lib/types";
import type { GlobalDashboardStats } from "@/lib/library/library-stats";
import { StatTileGrid } from "@/components/stats/StatTileGrid";

interface OverviewGlobalStatsProps {
  readonly globalStats: GlobalDashboardStats;
  readonly steamAccount?: UserAccountProfile["accounts"]["steam"];
}

export function OverviewGlobalStats({
  globalStats,
  steamAccount,
}: OverviewGlobalStatsProps) {
  const platformCount = globalStats.connectedCount || 1;

  return (
    <StatTileGrid
      tiles={[
        {
          label: "Jeux possédés",
          value: globalStats.totalGamesOwned,
          hint: `${globalStats.trackedGamesCount} dans la bibliothèque`,
          icon: Gamepad2,
          iconClass: "text-sky-400",
        },
        {
          label: "Jeux terminés",
          value: `${globalStats.finishedGamesPercent}%`,
          detail: `${globalStats.finishedGamesCount}/${globalStats.trackedGamesCount}`,
          icon: CheckCircle2,
          iconClass: "text-teal-400",
        },
        {
          label: "Platines / 100%",
          value: globalStats.totalCompletedGames,
          hint: "Tous comptes confondus",
          icon: Trophy,
          iconClass: "text-amber-400",
        },
        {
          label: "Succès débloqués",
          value: globalStats.totalAchievementsUnlocked,
          hint: `Sur ${platformCount} ${platformCount > 1 ? "plateformes" : "plateforme"}`,
          icon: Award,
          iconClass: "text-emerald-400",
        },
        {
          label: "Complétion moyenne",
          value: `${globalStats.avgCompletion}%`,
          hint: steamAccount?.stats.badges
            ? `${steamAccount.stats.badges} badges Steam · ${steamAccount.stats.dlcCount || 0} DLC`
            : "Jeux avec succès",
          icon: Sparkles,
          iconClass: "text-sky-400",
        },
      ]}
    />
  );
}
