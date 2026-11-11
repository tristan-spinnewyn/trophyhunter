// lib/library/date-time.ts

/** An ISO date as milliseconds, or null when it is missing or unreadable. */
export function toTime(date: string | undefined): number | null {
  if (!date) return null;
  const time = new Date(date).getTime();
  return Number.isNaN(time) ? null : time;
}
