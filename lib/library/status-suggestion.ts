// lib/library/status-suggestion.ts

import type { GameStatus, OwnedGame } from "@/lib/types";
import { formatLastSession } from "./last-session";
import { isPerfectGame } from "./library-tracking";

const DAY_MS = 86_400_000;
const RECENT_DAYS = 30;

export interface StatusSuggestion {
  readonly status: GameStatus;
  /** Why this status is proposed, shown next to it: "Jamais lancé". */
  readonly reason: string;
}

type SuggestableGame = Pick<OwnedGame, "totalAchievements" | "unlockedCount" | "playtimeHours" | "lastPlayed">;

function daysSince(lastPlayed: string | undefined, now: Date): number | null {
  if (!lastPlayed) return null;
  const time = new Date(lastPlayed).getTime();
  return Number.isNaN(time) ? null : (now.getTime() - time) / DAY_MS;
}

function wasNeverLaunched(game: SuggestableGame): boolean {
  return !game.lastPlayed && !game.playtimeHours && !game.unlockedCount;
}

/**
 * What the platform data hints at when sorting a game. It is only ever a proposal:
 * a game played long ago gets none, since paused or abandoned is the owner's call.
 */
export function suggestGameStatus(game: SuggestableGame, now: Date = new Date()): StatusSuggestion | null {
  if (isPerfectGame(game)) return { status: "completed", reason: "100 % des succès" };

  const days = daysSince(game.lastPlayed, now);
  if (days !== null && days <= RECENT_DAYS) {
    return { status: "in-progress", reason: `Joué ${formatLastSession(game.lastPlayed, now)}` };
  }

  if (wasNeverLaunched(game)) return { status: "backlog", reason: "Jamais lancé" };
  return null;
}
