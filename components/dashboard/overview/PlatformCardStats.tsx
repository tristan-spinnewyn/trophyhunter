// components/dashboard/overview/PlatformCardStats.tsx

import type { PlatformAccount } from "@/lib/types";
import type { PLATFORM_META } from "@/lib/platforms";

interface PlatformCardStatsProps {
  account: PlatformAccount;
  meta: typeof PLATFORM_META[keyof typeof PLATFORM_META];
}

export function PlatformCardStats({ account: acc, meta }: PlatformCardStatsProps) {
  return (
    <>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Jeux", value: acc.stats.gamesOwned },
          { label: meta.trophyLabel, value: acc.stats.totalAchievements },
          { label: meta.completeLabel, value: acc.stats.completedGames },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-slate-950/50 py-1.5">
            <dt className="sr-only">{label}</dt>
            <dd className="text-sm font-semibold tabular-nums text-white">{value}</dd>
            <dd aria-hidden className="truncate text-[11px] text-slate-500">{label}</dd>
          </div>
        ))}
      </dl>

      {acc.stats.gamerScore ? (
        <div className="text-center text-xs font-medium tabular-nums text-emerald-300">
          {acc.stats.gamerScore.toLocaleString("fr-FR")} G
        </div>
      ) : null}
    </>
  );
}
