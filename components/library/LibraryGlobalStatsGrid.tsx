// components/library/LibraryGlobalStatsGrid.tsx

import { CheckCircle2, Trophy, Award, Sparkles, type LucideIcon } from "lucide-react";
import type { GlobalDashboardStats } from "@/lib/library/library-stats";

interface LibraryGlobalStatsGridProps {
  readonly ownedGamesCount: number;
  readonly globalStats: GlobalDashboardStats;
}

interface StatTile {
  readonly label: string;
  readonly value: string | number;
  readonly detail?: string;
  readonly icon: LucideIcon;
  readonly iconClass: string;
}

export function LibraryGlobalStatsGrid({
  ownedGamesCount,
  globalStats,
}: LibraryGlobalStatsGridProps) {
  const tiles: readonly StatTile[] = [
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
  ];

  return (
    <dl className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {tiles.map(({ label, value, detail, icon: Icon, iconClass }) => (
        <div
          key={label}
          className="rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-3"
        >
          <dt className="flex items-center gap-1.5 text-xs text-slate-400">
            <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} aria-hidden />
            {label}
          </dt>
          <dd className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums text-white">{value}</span>
            {detail && <span className="text-xs tabular-nums text-slate-500">{detail}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
