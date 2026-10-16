// components/dashboard/overview/PlatformCardStats.tsx

import type { PlatformAccount } from "@/lib/types";
import type { PLATFORM_META } from "@/lib/storage";

interface PlatformCardStatsProps {
  account: PlatformAccount;
  meta: typeof PLATFORM_META[keyof typeof PLATFORM_META];
}

export function PlatformCardStats({ account: acc, meta }: PlatformCardStatsProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-900/90 p-2 text-center">
        <div>
          <div className="text-xs font-black text-white">
            {acc.stats.gamesOwned}
          </div>
          <div className="text-[10px] text-slate-400">Jeux</div>
        </div>
        <div>
          <div className="text-xs font-black text-emerald-400">
            {acc.stats.totalAchievements}
          </div>
          <div className="text-[10px] text-slate-400">
            {meta.trophyLabel}
          </div>
        </div>
        <div>
          <div className="text-xs font-black text-amber-400">
            {acc.stats.completedGames}
          </div>
          <div className="text-[10px] text-slate-400">
            {meta.completeLabel}
          </div>
        </div>
      </div>

      {acc.stats.gamerScore ? (
        <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 text-center">
          {acc.stats.gamerScore.toLocaleString("fr-FR")} G
        </div>
      ) : null}
    </>
  );
}
