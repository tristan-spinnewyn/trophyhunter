// lib/library/session-feed.ts
import type { PlatformType, PlaySession } from "@/lib/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface RecentlyPlayedGame {
  readonly appId: number;
  readonly platform: PlatformType;
  readonly name: string;
  readonly headerImg?: string;
  readonly minutes: number;
  readonly lastDetectedAt: string;
}

export interface RecentPlaySummary {
  readonly totalMinutes: number;
  /** One entry per game, the most played first. */
  readonly games: readonly RecentlyPlayedGame[];
}

/** "45 min", "2 h", "2 h 05". */
export function playedTimeLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, "0")}`;
}

/** The ISO date seven days before `now`: the start of "this week" for the feed. */
export function recentWeekStart(now: Date): string {
  return new Date(now.getTime() - WEEK_MS).toISOString();
}

/** Adds up the sessions game by game, so a game played three evenings shows once. */
export function summarizeRecentPlay(sessions: readonly PlaySession[]): RecentPlaySummary {
  const byGame = new Map<string, RecentlyPlayedGame>();
  for (const s of sessions) {
    const key = `${s.platform}_${s.appId}`;
    const known = byGame.get(key);
    byGame.set(key, {
      appId: s.appId,
      platform: s.platform,
      name: s.name,
      headerImg: s.headerImg,
      minutes: (known?.minutes ?? 0) + s.minutes,
      lastDetectedAt: known && known.lastDetectedAt > s.detectedAt ? known.lastDetectedAt : s.detectedAt,
    });
  }
  const games = [...byGame.values()].sort((a, b) => b.minutes - a.minutes);
  return { totalMinutes: games.reduce((sum, g) => sum + g.minutes, 0), games };
}
