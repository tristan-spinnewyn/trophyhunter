// lib/library/library-tracking.ts

import type { GameStatus, OwnedGame } from "@/lib/types";
import { GAME_STATUS_META, resolveGameStatus } from "@/lib/game-status/game-status.services";

/** Library sections, from what to play now to the archive. */
export const STATUS_SECTION_ORDER: readonly GameStatus[] = [
  "in-progress",
  "backlog",
  "paused",
  "completed",
  "abandoned",
];

const OPEN_BY_DEFAULT: ReadonlySet<GameStatus> = new Set(["in-progress", "backlog"]);

export interface StatusSection {
  readonly status: GameStatus;
  readonly title: string;
  readonly games: OwnedGame[];
  readonly isOpenByDefault: boolean;
}

export interface TrackingSummary {
  readonly countByStatus: Readonly<Record<GameStatus, number>>;
  readonly totalHours: number;
  /** Bonus: achievements are secondary to tracking. */
  readonly unlockedAchievements: number;
  readonly perfectGames: number;
}

function emptyStatusRecord<T>(init: () => T): Record<GameStatus, T> {
  return Object.fromEntries(STATUS_SECTION_ORDER.map((s) => [s, init()])) as Record<GameStatus, T>;
}

export function groupGamesByStatus(games: readonly OwnedGame[]): StatusSection[] {
  const byStatus = emptyStatusRecord<OwnedGame[]>(() => []);
  for (const g of games) byStatus[resolveGameStatus(g.status)].push(g);

  return STATUS_SECTION_ORDER.filter((status) => byStatus[status].length > 0).map((status) => ({
    status,
    title: GAME_STATUS_META[status].sectionTitle,
    games: byStatus[status],
    isOpenByDefault: OPEN_BY_DEFAULT.has(status),
  }));
}

export function isPerfectGame(game: Pick<OwnedGame, "totalAchievements" | "unlockedCount">): boolean {
  return game.totalAchievements > 0 && game.unlockedCount >= game.totalAchievements;
}

export function calculateTrackingSummary(games: readonly OwnedGame[]): TrackingSummary {
  const countByStatus = emptyStatusRecord(() => 0);
  let hours = 0;
  let unlockedAchievements = 0;
  let perfectGames = 0;

  for (const g of games) {
    countByStatus[resolveGameStatus(g.status)] += 1;
    hours += g.playtimeHours || 0;
    unlockedAchievements += g.unlockedCount || 0;
    if (isPerfectGame(g)) perfectGames += 1;
  }

  return { countByStatus, totalHours: Math.round(hours), unlockedAchievements, perfectGames };
}
