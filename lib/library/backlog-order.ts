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

/** 1-based place of each queued game, keyed by `platform_appId`. */
export function getQueuePositions(backlogGames: readonly RankedGame[]): Map<string, number> {
  const queued = sortBacklogQueue(backlogGames).filter(isQueued);
  return new Map(queued.map((g, i) => [`${g.platform}_${g.appId}`, i + 1]));
}
