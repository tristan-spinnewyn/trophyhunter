// components/accounts/overview/PlatformCardStats.tsx

import type { PlatformAccount } from "@/lib/types";
import type { PLATFORM_META } from "@/lib/platforms";

interface PlatformCardStatsProps {
  account: PlatformAccount;
  meta: typeof PLATFORM_META[keyof typeof PLATFORM_META];
}

export function PlatformCardStats({ account: acc, meta }: PlatformCardStatsProps) {
  return (
    <>
      <dl className="mt-1 flex flex-wrap gap-x-4 text-sm">
        {[
          { label: "Jeux", value: acc.stats.gamesOwned },
          { label: meta.trophyLabel, value: acc.stats.totalAchievements },
          { label: meta.completeLabel, value: acc.stats.completedGames },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <dt className="sr-only">{label}</dt>
            <dd className="font-semibold tabular-nums text-paper">{value}</dd>
            <dd aria-hidden className="text-dust">{label.toLowerCase()}</dd>
          </div>
        ))}
      </dl>

      {acc.stats.gamerScore ? (
        <div className="text-sm tabular-nums text-dust">
          {acc.stats.gamerScore.toLocaleString("fr-FR")} G
        </div>
      ) : null}
    </>
  );
}
