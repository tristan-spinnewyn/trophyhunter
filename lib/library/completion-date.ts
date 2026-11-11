// lib/library/completion-date.ts

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
/** No game was finished before this; it also rules out a year still being typed ("0202"). */
export const EARLIEST_COMPLETION_DAY = "1970-01-01";

/** A stored finish date as the "YYYY-MM-DD" a date field shows; empty when unknown. */
export function completionDateToInput(completedAt: string | undefined): string {
  if (!completedAt) return "";
  const time = new Date(completedAt).getTime();
  return Number.isNaN(time) ? "" : new Date(time).toISOString().slice(0, 10);
}

/**
 * A day picked in a date field, stored at midday UTC so its year never shifts with the time zone.
 * Null for anything that is not a real day, or a day before 1970 or after `now`.
 */
export function completionDateFromInput(value: string, now: Date): string | null {
  const match = DAY_PATTERN.exec(value);
  if (!match || value < EARLIEST_COMPLETION_DAY) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const isRealDay = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isRealDay || value > now.toISOString().slice(0, 10)) return null;
  return date.toISOString();
}
