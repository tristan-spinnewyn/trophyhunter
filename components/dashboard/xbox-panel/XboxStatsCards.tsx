// components/dashboard/xbox-panel/XboxStatsCards.tsx

import { Sparkles } from "lucide-react";
import type { UserAccountProfile } from "@/lib/types";

interface XboxStatsCardsProps {
  xboxAccount?: UserAccountProfile["accounts"]["xbox"];
  platformCounts: Record<string, number>;
}

export function XboxStatsCards({
  xboxAccount,
  platformCounts,
}: XboxStatsCardsProps) {
  return (
    <>
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4 text-xs text-slate-300 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-emerald-200">
            Synchronisation Xbox Live & PC Game Pass par API
          </p>
          <p className="text-[11px] text-slate-400">
            Vous pouvez ajouter vos jeux Xbox (console et PC) ci-dessous. En reliant votre Gamertag via OpenXBL, l&apos;intégralité de vos succès, raretés et Gamerscore sont automatiquement suivis sans entrer de mot de passe.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400">Jeux Xbox Suivis</div>
          <div className="text-2xl font-black text-white">{platformCounts.xbox || 0}</div>
          <div className="text-[11px] text-slate-400">Console & PC Game Pass</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-emerald-300">Succès Débloqués</div>
          <div className="text-2xl font-black text-emerald-400">
            {xboxAccount?.stats.totalAchievements || 0}
          </div>
          <div className="text-[11px] text-slate-400">Succès Xbox</div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-amber-300">Jeux 1000G / 100%</div>
          <div className="text-2xl font-black text-amber-400">
            {xboxAccount?.stats.completedGames || 0}
          </div>
          <div className="text-[11px] text-slate-400">Jeux complétés</div>
        </div>
      </div>
    </>
  );
}
