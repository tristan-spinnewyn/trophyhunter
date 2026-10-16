// components/dashboard/epic-panel/EpicStatsCards.tsx

import type { UserAccountProfile } from "@/lib/types";

interface EpicStatsCardsProps {
  epicAccount?: UserAccountProfile["accounts"]["epic"];
  epicCounts: { total: number; withAch: number; noAch: number };
}

export function EpicStatsCards({
  epicAccount,
  epicCounts,
}: EpicStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
        <div className="text-xs font-semibold text-slate-400">Total Jeux Epic</div>
        <div className="text-2xl font-black text-white">{epicCounts.total}</div>
        <div className="text-[11px] text-slate-400">Bibliothèque Epic</div>
      </div>
      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-1">
        <div className="text-xs font-semibold text-purple-300">Avec Succès XP</div>
        <div className="text-2xl font-black text-purple-400">{epicCounts.withAch}</div>
        <div className="text-[11px] text-slate-400">Chasse aux trophées active</div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
        <div className="text-xs font-semibold text-slate-500">Sans Succès</div>
        <div className="text-2xl font-black text-slate-400">{epicCounts.noAch}</div>
        <div className="text-[11px] text-slate-500">Pas de succès répertoriés</div>
      </div>
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
        <div className="text-xs font-semibold text-amber-300">Platines Epic</div>
        <div className="text-2xl font-black text-amber-400">
          {epicAccount?.stats.completedGames || 0}
        </div>
        <div className="text-[11px] text-slate-400">Jeux complétés à 100%</div>
      </div>
    </div>
  );
}
