// lib/library/shelf-length.ts

const FULL_SHELF = 24;

/** How many spines to draw for a platform: its share of the largest platform's shelf, never zero if it has games. */
export function shelfLengthBars(count: number, largestCount: number, maxBars = FULL_SHELF): number {
  if (count <= 0 || largestCount <= 0) return 0;
  return Math.max(1, Math.round((count / largestCount) * maxBars));
}
