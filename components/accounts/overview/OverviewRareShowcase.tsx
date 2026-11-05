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
    <div className="rounded-2xl border border-edge bg-plank/80 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-lamp-bright flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-lamp-bright" />
          Vitrine de vos succès les plus rares
        </h3>
        <span className="text-[11px] text-dust">
          Cliquez pour ouvrir le jeu
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {rareShowcase.map((item, idx) => (
          <button
            key={`${item.appId}_${idx}`}
            onClick={() => onSelectGame(item.appId)}
            className="flex items-center gap-3 rounded-2xl border border-lamp/20 bg-ink/70 p-2.5 text-left transition hover:border-lamp/50 hover:bg-plank"
          >
            <img
              src={item.icon}
              alt={item.achievementName}
              className="h-11 w-11 rounded-xl object-cover border border-lamp-bright/40 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-paper">
                {item.achievementName}
              </div>
              <div className="truncate text-[11px] text-dust">
                {item.gameName}
              </div>
              <div className="mt-0.5 inline-block rounded bg-lamp/15 px-1.5 py-px text-[11px] font-semibold text-lamp-bright">
                Ultra Rare • {item.percent}% des joueurs
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
