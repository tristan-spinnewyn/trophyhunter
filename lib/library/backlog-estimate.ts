// lib/library/backlog-estimate.ts

import type { GameDurations, OwnedGame, PlaySession } from "@/lib/types";
import { usualDurationSeconds } from "./duration-label";
import { toTime } from "./date-time";

/** How far back the play sessions count towards the current pace. */
export const PACE_WINDOW_DAYS = 90;

const DAY_MS = 86_400_000;
const WEEKS_PER_MONTH = 4.35;

export interface BacklogEstimate {
  /** Hours to beat the backlog games whose duration is known, rounded. */
  readonly totalHours: number;
  /** Backlog games IGDB has no duration for. */
  readonly unknownCount: number;
  /** Weeks it takes at the hours played per week lately, or null without recent sessions. */
  readonly weeksAtPace: number | null;
}

/** How long the backlog takes, and how long that is at the owner's recent pace. */
export function estimateBacklog(
  backlog: readonly OwnedGame[],
  durations: Readonly<Record<string, GameDurations>>,
  sessions: readonly PlaySession[],
  now: Date
): BacklogEstimate {
  let totalSeconds = 0;
  let unknownCount = 0;
  for (const game of backlog) {
    const seconds = usualDurationSeconds(durations[`${game.platform}_${game.appId}`]);
    if (seconds === null) unknownCount += 1;
    else totalSeconds += seconds;
  }
  const totalHours = Math.round(totalSeconds / 3600);

  const windowStart = now.getTime() - PACE_WINDOW_DAYS * DAY_MS;
  const recentMinutes = sessions
    .filter((s) => (toTime(s.detectedAt) ?? 0) >= windowStart)
    .reduce((sum, s) => sum + s.minutes, 0);
  const hoursPerWeek = recentMinutes / 60 / (PACE_WINDOW_DAYS / 7);

  return { totalHours, unknownCount, weeksAtPace: hoursPerWeek > 0 && totalHours > 0 ? totalHours / hoursPerWeek : null };
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

function paceLabel(weeks: number): string {
  if (weeks < 8) return `environ ${plural(Math.max(1, Math.round(weeks)), "semaine", "semaines")} à ton rythme`;
  return `environ ${Math.round(weeks / WEEKS_PER_MONTH)} mois à ton rythme`;
}

/** "≈ 140 h · environ 4 mois à ton rythme · dont 3 jeux sans durée connue"; null when no duration is known. */
export function describeBacklogEstimate({ totalHours, unknownCount, weeksAtPace }: BacklogEstimate): string | null {
  if (totalHours === 0) return null;
  return [
    `≈ ${totalHours} h`,
    weeksAtPace !== null ? paceLabel(weeksAtPace) : null,
    unknownCount > 0 ? `dont ${plural(unknownCount, "jeu", "jeux")} sans durée connue` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
