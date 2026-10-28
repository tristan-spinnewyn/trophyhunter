// components/library/LibraryGlobalStatsGrid.tsx

import { CheckCircle2, Trophy, Award, Sparkles } from "lucide-react";
import type { GlobalDashboardStats } from "@/lib/library/library-stats";
import { StatTileGrid } from "@/components/stats/StatTileGrid";

interface LibraryGlobalStatsGridProps {
  readonly ownedGamesCount: number;
  readonly globalStats: GlobalDashboardStats;
}

export function LibraryGlobalStatsGrid({
  ownedGamesCount,
  globalStats,
}: LibraryGlobalStatsGridProps) {
  return (
    <StatTileGrid
      tiles={[
        {
          label: "Platines / 100%",
          value: globalStats.totalCompletedGames,
          icon: Trophy,
          iconClass: "text-amber-400",
        },
        {
          label: "Succès débloqués",
          value: globalStats.totalAchievementsUnlocked,
          icon: Award,
          iconClass: "text-emerald-400",
        },
        {
          label: "Complétion moyenne",
          value: `${globalStats.avgCompletion}%`,
          icon: Sparkles,
          iconClass: "text-sky-400",
        },
        {
          label: "Jeux terminés",
          value: `${globalStats.finishedGamesPercent}%`,
          detail: `${globalStats.finishedGamesCount}/${ownedGamesCount}`,
          icon: CheckCircle2,
          iconClass: "text-teal-400",
        },
      ]}
    />
  );
}
