// components/dashboard/gog-panel/GogStatsCards.tsx

import type { UserAccountProfile } from "@/lib/types";

interface GogStatsCardsProps {
  gogAccount?: UserAccountProfile["accounts"]["gog"];
  platformCounts: Record<string, number>;
}

export function GogStatsCards({
  gogAccount,
  platformCounts,
}: GogStatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
        <div className="text-xs font-semibold text-slate-400">Jeux GOG</div>
        <div className="text-2xl font-black text-white">{platformCounts.gog || 0}</div>
        <div className="text-[11px] text-slate-400">Bibliothèque GOG</div>
      </div>
      <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-4 space-y-1">
        <div className="text-xs font-semibold text-violet-300">Succès Débloqués</div>
        <div className="text-2xl font-black text-violet-400">
          {gogAccount?.stats.totalAchievements || 0}
        </div>
        <div className="text-[11px] text-slate-400">Succès GOG</div>
      </div>
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
        <div className="text-xs font-semibold text-amber-300">Jeux 100%</div>
        <div className="text-2xl font-black text-amber-400">
          {gogAccount?.stats.completedGames || 0}
        </div>
        <div className="text-[11px] text-slate-400">Platines GOG</div>
      </div>
    </div>
  );
}
