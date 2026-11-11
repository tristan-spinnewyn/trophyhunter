// lib/library/backlog-order.ts

import type { OwnedGame } from "@/lib/types";

type RankedGame = Pick<OwnedGame, "appId" | "platform" | "backlogRank">;

const isQueued = (game: RankedGame): boolean => typeof game.backlogRank === "number";
const rankOf = (game: RankedGame): number => game.backlogRank ?? 0;

/** The backlog as a queue: queued games first, lowest rank first; the rest keep their incoming order. */
export function sortBacklogQueue<T extends RankedGame>(games: readonly T[]): T[] {
  const queued = games.filter(isQueued).sort((a, b) => rankOf(a) - rankOf(b));
  return [...queued, ...games.filter((g) => !isQueued(g))];
}

/** The rank that puts a game ahead of everything already queued. */
export function rankToPlayNext(backlogGames: readonly RankedGame[]): number {
  const ranks = backlogGames.filter(isQueued).map(rankOf);
  return ranks.length > 0 ? Math.min(...ranks) - 1 : 0;
}

/**
 * The queue once the game at `fromIndex` of the backlog shelf is dropped at `toIndex`.
 * The shelf reads as the queue: every game up to the drop point ends up queued, in shelf order.
 */
export function queueAfterMove<T extends RankedGame>(shelf: readonly T[], fromIndex: number, toIndex: number): T[] {
  const queuedCount = shelf.filter(isQueued).length;
  if (fromIndex === toIndex) return shelf.slice(0, queuedCount);

  const moved = shelf[fromIndex];
  const order = shelf.filter((_, i) => i !== fromIndex);
  order.splice(toIndex, 0, moved);
  const queueLength = Math.max(isQueued(moved) ? queuedCount : queuedCount + 1, toIndex + 1);
  return order.slice(0, queueLength);
}

const keyOf = (game: RankedGame) => `${game.platform}_${game.appId}`;

/**
 * The whole queue once the visible part of the backlog shelf was reordered into `visibleQueue`.
 * Queued games hidden by a filter keep their slot; the visible slots take the new order, and any
 * newly queued visible game goes after them.
 */
export function mergeWithHiddenQueue<T extends RankedGame>(
  backlog: readonly T[],
  visibleShelf: readonly RankedGame[],
  visibleQueue: readonly T[]
): T[] {
  const visibleKeys = new Set(visibleShelf.map(keyOf));
  const pending = [...visibleQueue];
  const merged: T[] = [];
  for (const queued of sortBacklogQueue(backlog).filter(isQueued)) {
    if (!visibleKeys.has(keyOf(queued))) merged.push(queued);
    else if (pending.length > 0) merged.push(pending.shift() as T);
  }
  return [...merged, ...pending];
}

/** 1-based place of each queued game, keyed by `platform_appId`. */
export function getQueuePositions(backlogGames: readonly RankedGame[]): Map<string, number> {
  const queued = sortBacklogQueue(backlogGames).filter(isQueued);
  return new Map(queued.map((g, i) => [`${g.platform}_${g.appId}`, i + 1]));
}
