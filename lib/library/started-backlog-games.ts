// lib/library/started-backlog-games.ts

import type { OwnedGame } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";

function toTime(date: string | undefined): number | null {
  if (!date) return null;
  const time = new Date(date).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Backlog games played after they were put in the backlog, most recent session first.
 * A game without a readable status date or session is left out: no guess is better than a wrong nudge.
 */
export function findStartedBacklogGames(games: readonly OwnedGame[]): OwnedGame[] {
  const started: { readonly game: OwnedGame; readonly playedAt: number }[] = [];

  for (const game of games) {
    if (resolveGameStatus(game.status) !== "backlog") continue;
    const queuedAt = toTime(game.statusChangedAt);
    const playedAt = toTime(game.lastPlayed);
    if (queuedAt !== null && playedAt !== null && playedAt > queuedAt) started.push({ game, playedAt });
  }

  return started.sort((a, b) => b.playedAt - a.playedAt).map((s) => s.game);
}
