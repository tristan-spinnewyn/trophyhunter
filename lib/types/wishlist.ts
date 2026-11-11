// lib/types/wishlist.ts
import type { PlatformType } from "./platform";

/** A wished-for game, owned or not, with what its store last charged for it. */
export interface WishlistEntry {
  readonly appId: number;
  readonly platform: PlatformType;
  readonly name: string;
  readonly headerImg: string;
  readonly addedAt: string;
  /** The price the owner waits for, in cents. */
  readonly targetPriceCents?: number;
  /** The last price the store gave, in cents. */
  readonly lastPriceCents?: number;
  readonly currency?: string;
  readonly priceCheckedAt?: string;
  /** When the game comes (or came) out, from IGDB. */
  readonly releaseDate?: string;
}
