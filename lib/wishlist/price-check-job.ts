// lib/wishlist/price-check-job.ts
import { listWishlistPriceChecksDue, recordWishlistPrice } from "@/lib/db";
import type { PlatformType } from "@/lib/types";
import { fetchStorePrice, type StorePrice } from "./store-price";

/** Stores are asked a few prices per pass, so a long wishlist is spread over several passes. */
const CHECKS_PER_PASS = 30;

/** Refreshes the prices of the wishes not checked for a day; returns how many were asked. */
export async function checkWishlistPrices(
  now: Date,
  fetchPrice: (platform: PlatformType, appId: number) => Promise<StorePrice | null> = fetchStorePrice
): Promise<number> {
  const due = listWishlistPriceChecksDue(now, CHECKS_PER_PASS);
  for (const { userId, appId, platform } of due) {
    recordWishlistPrice(userId, appId, await fetchPrice(platform, appId), now);
  }
  return due.length;
}
