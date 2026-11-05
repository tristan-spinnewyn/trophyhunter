// components/library/duplicates/DuplicateGroupCard.tsx

import type { OwnedGame } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import {
  GAME_STATUS_META,
  resolveGameStatus,
} from "@/lib/game-status/game-status.services";

interface DuplicateGroupCardProps {
  readonly group: { title: string; games: OwnedGame[] };
  readonly onSelectGame: (appId: number) => void;
}

export function DuplicateGroupCard({
  group,
  onSelectGame,
}: DuplicateGroupCardProps) {
  return (
    <div className="rounded-sheet border border-edge bg-ink/90 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-edge/80 pb-2.5">
        <h4 className="text-sm font-semibold text-paper truncate">
          {group.title}
        </h4>
        <span className="rounded-full bg-platinum/20 border border-platinum/40 px-2 py-0.5 text-[11px] font-bold text-platinum shrink-0">
          {group.games.length} plateformes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {group.games.map((g) => {
          const pMeta = PLATFORM_META[g.platform] || PLATFORM_META.steam;
          const statusMeta = GAME_STATUS_META[resolveGameStatus(g.status)];
          const pct =
            g.totalAchievements > 0
              ? Math.min(
                  100,
                  Math.round((g.unlockedCount / g.totalAchievements) * 100)
                )
              : 0;

          return (
            <div
              key={`${g.platform}_${g.appId}`}
              onClick={() => onSelectGame(g.appId)}
              className="flex flex-col justify-between rounded-control border border-edge bg-plank/90 p-3 hover:border-platinum/50 cursor-pointer transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-bold border ${pMeta.badgeClass}`}
                    >
                      {pMeta.shortName}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-bold border ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                  {g.totalAchievements > 0 ? (
                    <span className="text-[11px] font-semibold text-done">
                      {pct}% ({g.unlockedCount}/{g.totalAchievements})
                    </span>
                  ) : (
                    <span className="text-[11px] text-faint">
                      Sans succès
                    </span>
                  )}
                </div>

                <img
                  src={g.headerImg}
                  alt={g.name}
                  className="h-16 w-full object-cover rounded-control bg-ink"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              <div className="mt-2 pt-2 border-t border-edge/60 flex items-center justify-between text-[11px] text-dust">
                <span>{g.playtimeHours ? `${g.playtimeHours} h` : "0 h"}</span>
                <span className="text-lamp-bright hover:underline font-semibold">
                  Ouvrir →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
