// components/accounts/overview/OverviewRareShowcase.tsx

import { Star } from "lucide-react";
import type { RareAchievementShowcaseItem } from "@/lib/types";

interface OverviewRareShowcaseProps {
  rareShowcase: RareAchievementShowcaseItem[];
  onSelectGame: (appId: number) => void;
}

export function OverviewRareShowcase({
  rareShowcase,
  onSelectGame,
}: OverviewRareShowcaseProps) {
  if (!rareShowcase || rareShowcase.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-amber-400" />
          Vitrine de vos succès les plus rares
        </h3>
        <span className="text-[11px] text-slate-400">
          Cliquez pour ouvrir le jeu
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {rareShowcase.map((item, idx) => (
          <button
            key={`${item.appId}_${idx}`}
            onClick={() => onSelectGame(item.appId)}
            className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-slate-950/70 p-2.5 text-left transition hover:border-amber-500/50 hover:bg-slate-900"
          >
            <img
              src={item.icon}
              alt={item.achievementName}
              className="h-11 w-11 rounded-xl object-cover border border-amber-400/40 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-white">
                {item.achievementName}
              </div>
              <div className="truncate text-[11px] text-slate-400">
                {item.gameName}
              </div>
              <div className="mt-0.5 inline-block rounded bg-amber-500/15 px-1.5 py-px text-[11px] font-semibold text-amber-300">
                Ultra Rare • {item.percent}% des joueurs
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
