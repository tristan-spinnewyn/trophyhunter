// lib/library/last-session.ts

const DAY_MS = 86_400_000;
const relative = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

/** "hier", "il y a 3 jours"… for a game's last session; null when it was never played. */
export function formatLastSession(lastPlayed: string | undefined, now: Date = new Date()): string | null {
  if (!lastPlayed) return null;
  const time = new Date(lastPlayed).getTime();
  if (Number.isNaN(time)) return null;

  const days = Math.max(0, Math.floor((now.getTime() - time) / DAY_MS));
  if (days < 7) return relative.format(-days, "day");
  if (days < 30) return relative.format(-Math.floor(days / 7), "week");
  if (days < 365) return relative.format(-Math.floor(days / 30), "month");
  return relative.format(-Math.floor(days / 365), "year");
}
