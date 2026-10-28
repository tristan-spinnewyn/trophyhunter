// lib/game-title.ts
// Client-safe: shared by server-side duplicate detection and browser stats.

/**
 * Reduces a game title to a comparison key: lowercase alphanumerics only,
 * without edition suffixes (GOTY, Ultimate, Director's Cut...), so the same
 * game matches across platforms.
 */
export function normalizeGameTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(
      /\b(game of the year edition|goty edition|definitive edition|director's cut|remastered|enhanced edition|special edition|standard edition|deluxe edition|ultimate edition|complete edition)\b/gi,
      ""
    )
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}
