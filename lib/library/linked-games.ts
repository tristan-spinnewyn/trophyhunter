// lib/library/linked-games.ts
// The same game owned on several platforms, merged by the owner: shown and counted once.

import type { GameRef, OwnedGame } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import { toTime } from "./date-time";

export const gameRefKey = (ref: GameRef): string => `${ref.platform}_${ref.appId}`;

function latest(a: string | undefined, b: string | undefined): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return (toTime(b) ?? 0) > (toTime(a) ?? 0) ? b : a;
}

function addPlaytime(a: number | undefined, b: number | undefined): number | undefined {
  return a === undefined && b === undefined ? undefined : (a ?? 0) + (b ?? 0);
}

/**
 * Folds every merged copy into its primary game: the primary keeps its status, review and notes,
 * and takes the playtime of all copies and the latest session among them.
 * A copy whose primary is missing from the list stays as it is.
 */
export function mergeLinkedGames(games: readonly OwnedGame[]): OwnedGame[] {
  const primaries = new Map(games.map((g) => [gameRefKey(g), g]));
  const copiesByPrimary = new Map<string, OwnedGame[]>();
  for (const game of games) {
    if (!game.mergedInto || !primaries.has(gameRefKey(game.mergedInto))) continue;
    const key = gameRefKey(game.mergedInto);
    copiesByPrimary.set(key, [...(copiesByPrimary.get(key) ?? []), game]);
  }
  if (copiesByPrimary.size === 0) return [...games];

  return games
    .filter((g) => !g.mergedInto || !primaries.has(gameRefKey(g.mergedInto)))
    .map((game) => {
      const copies = copiesByPrimary.get(gameRefKey(game));
      if (!copies) return game;
      return {
        ...game,
        playtimeHours: copies.reduce((sum, c) => addPlaytime(sum, c.playtimeHours), game.playtimeHours),
        lastPlayed: copies.reduce((last, c) => latest(last, c.lastPlayed), game.lastPlayed),
        linkedCopies: copies.map(({ platform, appId }) => ({ platform, appId })),
      };
    });
}

/** The copy to keep as the game when merging: one whose status was chosen, then the most played. */
export function choosePrimaryGame(games: readonly OwnedGame[]): OwnedGame {
  const isSorted = (g: OwnedGame) => (resolveGameStatus(g.status) === "unsorted" ? 0 : 1);
  return [...games].sort((a, b) => isSorted(b) - isSorted(a) || (b.playtimeHours ?? 0) - (a.playtimeHours ?? 0))[0];
}

/** Whether every copy of a duplicate group but one is merged into that one. */
export function isMergedGroup(games: readonly OwnedGame[]): boolean {
  const unmerged = games.filter((g) => !g.mergedInto);
  if (unmerged.length !== 1) return false;
  const primaryKey = gameRefKey(unmerged[0]);
  return games.every((g) => g === unmerged[0] || (g.mergedInto && gameRefKey(g.mergedInto) === primaryKey));
}
