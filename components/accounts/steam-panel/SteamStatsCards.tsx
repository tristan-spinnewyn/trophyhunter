// components/accounts/steam-panel/SteamStatsCards.tsx

import type { PlatformAccount } from "@/lib/types";

interface StatsCardsProps {
  steamAccount?: PlatformAccount;
  platformCounts: Record<string, number>;
}

export function SteamStatsCards({ steamAccount, platformCounts }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
        <div className="text-xs font-semibold text-slate-400">Jeux Steam</div>
        <div className="text-2xl font-semibold text-white">{platformCounts.steam || 0}</div>
        <div className="text-[11px] text-slate-400">Dans votre bibliothèque</div>
      </div>
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1">
        <div className="text-xs font-semibold text-emerald-300">Succès Débloqués</div>
        <div className="text-2xl font-semibold text-emerald-400">{steamAccount?.stats.totalAchievements || 0}</div>
        <div className="text-[11px] text-slate-400">Sur vos jeux Steam</div>
      </div>
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
        <div className="text-xs font-semibold text-amber-300">Jeux 100%</div>
        <div className="text-2xl font-semibold text-amber-400">{steamAccount?.stats.completedGames || 0}</div>
        <div className="text-[11px] text-slate-400">Platines Steam</div>
      </div>
      <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-1">
        <div className="text-xs font-semibold text-sky-300">Badges & DLC</div>
        <div className="text-2xl font-semibold text-sky-400">{steamAccount?.stats.badges || 0}</div>
        <div className="text-[11px] text-slate-400">{steamAccount?.stats.dlcCount || 0} DLC possédés</div>
      </div>
    </div>
  );
}
