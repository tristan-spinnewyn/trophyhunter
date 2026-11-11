// lib/library/duration-label.ts

import type { GameDurations } from "@/lib/types";

function hoursLabel(seconds: number): string {
  return seconds < 3600 ? "< 1 h" : `${Math.round(seconds / 3600)} h`;
}

/** The duration a game stands for: the usual playthrough, else the quickest, else the full one. */
export function usualDurationSeconds(durations: GameDurations | undefined): number | null {
  return durations?.normallySeconds ?? durations?.hastilySeconds ?? durations?.completelySeconds ?? null;
}

/** "12 h" for a spine, from the usual duration. */
export function shortDurationLabel(durations: GameDurations | undefined): string | null {
  const seconds = usualDurationSeconds(durations);
  return seconds === null ? null : hoursLabel(seconds);
}

/** "Environ 12 h · histoire seule 8 h · à 100 % 40 h", leaving out what IGDB does not know. */
export function describeDurations(durations: GameDurations | undefined): string | null {
  if (!durations) return null;
  const parts = [
    durations.normallySeconds !== null ? `environ ${hoursLabel(durations.normallySeconds)}` : null,
    durations.hastilySeconds !== null ? `histoire seule ${hoursLabel(durations.hastilySeconds)}` : null,
    durations.completelySeconds !== null ? `à 100 % ${hoursLabel(durations.completelySeconds)}` : null,
  ].filter((p): p is string => p !== null);
  if (parts.length === 0) return null;
  const sentence = parts.join(" · ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
