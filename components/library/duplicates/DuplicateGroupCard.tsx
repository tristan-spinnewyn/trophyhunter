// components/library/duplicates/DuplicateGroupCard.tsx

import type { OwnedGame } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import {
  GAME_STATUS_META,
  resolveGameStatus,
} from "@/lib/game-status/game-status.services";
import { isMergedGroup } from "@/lib/library/linked-games";

interface DuplicateGroupCardProps {
  readonly group: { title: string; games: OwnedGame[] };
  readonly onSelectGame: (appId: number) => void;
  /** Merges the copies into one game; left out where merging is not offered. */
  readonly onMerge?: (games: OwnedGame[]) => void;
  /** Unmerges the copies of the given primary game. */
  readonly onUnmerge?: (primary: OwnedGame) => void;
}

export function DuplicateGroupCard({
  group,
  onSelectGame,
  onMerge,
  onUnmerge,
}: DuplicateGroupCardProps) {
  const isMerged = isMergedGroup(group.games);
  const primary = isMerged ? group.games.find((g) => !g.mergedInto) : undefined;

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
                    {g === primary && (
                      <span className="rounded px-1.5 py-0.5 text-[11px] font-bold border border-edge text-paper">
                        Principal
                      </span>
                    )}
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

      {isMerged && primary && onUnmerge && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-done">Fusionnés</span>
          <button
            type="button"
            aria-label={`Dissocier ${group.title}`}
            onClick={() => onUnmerge(primary)}
            className="text-dust transition hover:text-paper"
          >
            Dissocier
          </button>
        </div>
      )}
      {!isMerged && onMerge && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-dust">Un seul jeu, compté une fois dans tes étagères et ton année.</span>
          <button
            type="button"
            aria-label={`Fusionner ${group.title}`}
            onClick={() => onMerge(group.games)}
            className="shrink-0 rounded-control border border-edge px-3 py-1 text-paper-dim transition hover:border-seam hover:text-paper"
          >
            Fusionner
          </button>
        </div>
      )}
    </div>
  );
}
