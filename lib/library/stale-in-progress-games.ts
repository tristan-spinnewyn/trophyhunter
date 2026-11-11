// lib/library/stale-in-progress-games.ts

import type { OwnedGame } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import { toTime } from "./date-time";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** The latest sign of life of a game, as an ISO date: its last session or the last status choice. */
export function lastActivityAt(game: Pick<OwnedGame, "lastPlayed" | "statusChangedAt">): string | undefined {
  const dated = [game.lastPlayed, game.statusChangedAt].filter((d): d is string => toTime(d) !== null);
  if (dated.length === 0) return undefined;
  return dated.reduce((latest, d) => ((toTime(d) as number) > (toTime(latest) as number) ? d : latest));
}

/**
 * In-progress games nobody has touched for `weeks`: no session and no status choice since then.
 * Oldest first. Confirming a game as still in progress re-dates its status, which silences it again.
 */
export function findStaleInProgressGames(games: readonly OwnedGame[], weeks: number, now: Date): OwnedGame[] {
  const threshold = now.getTime() - weeks * WEEK_MS;
  const stale: { readonly game: OwnedGame; readonly lastActivity: number }[] = [];

  for (const game of games) {
    if (resolveGameStatus(game.status) !== "in-progress") continue;
    const lastActivity = toTime(lastActivityAt(game));
    if (lastActivity !== null && lastActivity < threshold) stale.push({ game, lastActivity });
  }

  return stale.sort((a, b) => a.lastActivity - b.lastActivity).map((s) => s.game);
}
