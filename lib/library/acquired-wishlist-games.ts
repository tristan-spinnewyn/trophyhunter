// lib/library/acquired-wishlist-games.ts

import type { OwnedGame } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";

/** Wished-for games a sync brought into the collection that still wait to be sorted. */
export function findAcquiredWishlistGames(games: readonly OwnedGame[], wishlistIds: readonly number[]): OwnedGame[] {
  const wished = new Set(wishlistIds);
  return games.filter((g) => wished.has(g.appId) && resolveGameStatus(g.status) === "unsorted");
}
