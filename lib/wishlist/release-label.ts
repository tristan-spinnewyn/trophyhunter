// lib/wishlist/release-label.ts

const DAY_MS = 86_400_000;
/** A release closer than this is counted in days; further away it is dated. */
const COUNTDOWN_DAYS = 60;
/** A release stays news this long after it happened. */
const JUST_OUT_DAYS = 14;

export interface ReleaseLabel {
  readonly text: string;
  /** The game is out: it can be bought now. */
  readonly isOut: boolean;
}

const utcDay = (time: number) => Math.floor(time / DAY_MS);

/** "Sort dans 12 j", "Sort le 3 septembre 2027", "Sorti !"; null for an unknown or older release. */
export function describeRelease(releaseDate: string | undefined, now: Date): ReleaseLabel | null {
  const time = releaseDate ? Date.parse(releaseDate) : Number.NaN;
  if (Number.isNaN(time)) return null;
  const days = utcDay(time) - utcDay(now.getTime());

  if (days > COUNTDOWN_DAYS) {
    const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(time);
    return { text: `Sort le ${date}`, isOut: false };
  }
  if (days > 1) return { text: `Sort dans ${days} j`, isOut: false };
  if (days === 1) return { text: "Sort demain", isOut: false };
  if (days === 0) return { text: "Sort aujourd'hui", isOut: true };
  if (days >= -JUST_OUT_DAYS) return { text: "Sorti !", isOut: true };
  return null;
}
