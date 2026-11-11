// lib/library/year-review.ts

import type { OwnedGame, PlatformType, PlaySession } from "@/lib/types";
import { toTime } from "./date-time";
import { summarizeRecentPlay, type RecentlyPlayedGame } from "./session-feed";

const BEST_RATED_COUNT = 3;

export interface YearReview {
  readonly year: number;
  /** Games finished that year, latest finish first. */
  readonly finished: readonly OwnedGame[];
  /** Games abandoned that year, latest first. */
  readonly abandoned: readonly OwnedGame[];
  /** Hours of play sessions recorded that year, rounded. */
  readonly hoursPlayed: number;
  /** The game with the most session time that year. */
  readonly mostPlayed: RecentlyPlayedGame | null;
  /** The platform with the most session hours, or with the most finishes when no session is known (hours null then). */
  readonly topPlatform: { readonly platform: PlatformType; readonly hours: number | null } | null;
  /** Games finished that year with every achievement unlocked. */
  readonly perfectCount: number;
  /** The best-rated games finished or abandoned that year. */
  readonly bestRated: readonly OwnedGame[];
}

function yearOf(date: string | undefined): number | null {
  const time = toTime(date);
  return time === null ? null : new Date(time).getUTCFullYear();
}

function datedIn(year: number, games: readonly OwnedGame[], dateOf: (g: OwnedGame) => string | undefined): OwnedGame[] {
  return games
    .filter((g) => yearOf(dateOf(g)) === year)
    .sort((a, b) => (toTime(dateOf(b)) as number) - (toTime(dateOf(a)) as number));
}

function mostCommonPlatform(games: readonly OwnedGame[]): PlatformType | null {
  const counts = new Map<PlatformType, number>();
  for (const g of games) counts.set(g.platform, (counts.get(g.platform) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function topSessionPlatform(played: readonly RecentlyPlayedGame[]): { platform: PlatformType; hours: number } | null {
  const minutes = new Map<PlatformType, number>();
  for (const g of played) minutes.set(g.platform, (minutes.get(g.platform) ?? 0) + g.minutes);
  const top = [...minutes.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? { platform: top[0], hours: Math.round(top[1] / 60) } : null;
}

/** "What did my year of gaming look like?": finishes, abandons, time played and favourites of one calendar year. */
export function buildYearReview(year: number, games: readonly OwnedGame[], sessions: readonly PlaySession[]): YearReview {
  const finished = datedIn(year, games, (g) => g.completedAt);
  const abandoned = datedIn(year, games, (g) => g.abandonedAt);
  const played = summarizeRecentPlay(sessions.filter((s) => yearOf(s.detectedAt) === year));
  const fallbackPlatform = mostCommonPlatform(finished);

  return {
    year,
    finished,
    abandoned,
    hoursPlayed: Math.round(played.totalMinutes / 60),
    mostPlayed: played.games[0] ?? null,
    topPlatform: topSessionPlatform(played.games) ?? (fallbackPlatform ? { platform: fallbackPlatform, hours: null } : null),
    perfectCount: finished.filter((g) => g.totalAchievements > 0 && g.unlockedCount >= g.totalAchievements).length,
    bestRated: [...finished, ...abandoned]
      .filter((g) => g.rating !== undefined)
      .sort((a, b) => (b.rating as number) - (a.rating as number))
      .slice(0, BEST_RATED_COUNT),
  };
}

/** The years a review can be shown for: any year with a finish, an abandon or a session, plus the current one. */
export function reviewYears(games: readonly OwnedGame[], sessions: readonly PlaySession[], now: Date): number[] {
  const years = new Set<number>([now.getUTCFullYear()]);
  for (const g of games) {
    for (const date of [g.completedAt, g.abandonedAt]) {
      const year = yearOf(date);
      if (year !== null) years.add(year);
    }
  }
  for (const s of sessions) {
    const year = yearOf(s.detectedAt);
    if (year !== null) years.add(year);
  }
  return [...years].sort((a, b) => b - a);
}
