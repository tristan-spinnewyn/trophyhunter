// lib/library/completed-by-year.ts

import type { OwnedGame } from "@/lib/types";

export interface CompletedYearGroup {
  /** "2026", or "unknown" for games finished at an unknown date. */
  readonly key: string;
  readonly label: string;
  readonly games: OwnedGame[];
}

const UNKNOWN_KEY = "unknown";
const UNKNOWN_LABEL = "Date inconnue";

function completionTime(game: OwnedGame): number | null {
  if (!game.completedAt) return null;
  const time = new Date(game.completedAt).getTime();
  return Number.isNaN(time) ? null : time;
}

/** Answers "what did I finish this year?": latest year first, most recent finish first, undated games last. */
export function groupCompletedByYear(games: readonly OwnedGame[]): CompletedYearGroup[] {
  const dated = new Map<number, { game: OwnedGame; time: number }[]>();
  const undated: OwnedGame[] = [];

  for (const game of games) {
    const time = completionTime(game);
    if (time === null) {
      undated.push(game);
      continue;
    }
    const year = new Date(time).getUTCFullYear();
    dated.set(year, [...(dated.get(year) ?? []), { game, time }]);
  }

  const groups: CompletedYearGroup[] = [...dated.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, entries]) => ({
      key: String(year),
      label: String(year),
      games: entries.sort((a, b) => b.time - a.time).map((e) => e.game),
    }));

  if (undated.length > 0) groups.push({ key: UNKNOWN_KEY, label: UNKNOWN_LABEL, games: undated });
  return groups;
}
