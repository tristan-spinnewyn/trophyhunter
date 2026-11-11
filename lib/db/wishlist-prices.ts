// lib/db/wishlist-prices.ts
import { getDb } from "./connection";
import type { PlatformType } from "../types";
import { PRICED_PLATFORMS, type StorePrice } from "../wishlist/store-price";

/** How long a store price is trusted before it is asked again. */
const PRICE_MAX_AGE_MS = 24 * 3_600_000;

/** Sets (or clears, with null) the price the owner waits for; false when the game is not wished for. */
export function setWishlistTargetPrice(userId: string, appId: number, targetCents: number | null): boolean {
  const result = getDb()
    .prepare("UPDATE user_wishlist SET target_price_cents = ? WHERE user_id = ? AND app_id = ?")
    .run(targetCents, userId, appId);
  return Number(result.changes) > 0;
}

/** Records a store's answer; a store that did not answer keeps the last price but still dates the attempt. */
export function recordWishlistPrice(userId: string, appId: number, price: StorePrice | null, checkedAt: Date): void {
  getDb()
    .prepare(
      `UPDATE user_wishlist
       SET last_price_cents = COALESCE(?, last_price_cents), currency = COALESCE(?, currency), price_checked_at = ?
       WHERE user_id = ? AND app_id = ?`
    )
    .run(price?.cents ?? null, price?.currency ?? null, checkedAt.toISOString(), userId, appId);
}

export interface WishlistPriceCheck {
  readonly userId: string;
  readonly appId: number;
  readonly platform: PlatformType;
}

/** Wishes on a priced store whose price is older than a day, never-checked and oldest first, at most `limit`. */
export function listWishlistPriceChecksDue(now: Date, limit: number): WishlistPriceCheck[] {
  const staleBefore = new Date(now.getTime() - PRICE_MAX_AGE_MS).toISOString();
  const placeholders = PRICED_PLATFORMS.map(() => "?").join(", ");
  const rows = getDb()
    .prepare(
      `SELECT user_id, app_id, platform FROM user_wishlist
       WHERE platform IN (${placeholders}) AND (price_checked_at IS NULL OR price_checked_at < ?)
       ORDER BY price_checked_at IS NOT NULL, price_checked_at, app_id
       LIMIT ?`
    )
    .all(...PRICED_PLATFORMS, staleBefore, limit) as Array<{ user_id: string; app_id: number; platform: PlatformType }>;
  return rows.map((r) => ({ userId: r.user_id, appId: r.app_id, platform: r.platform }));
}
