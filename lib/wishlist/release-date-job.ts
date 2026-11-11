// lib/wishlist/release-date-job.ts
import { listWishlistReleaseChecksDue, saveReleaseDates } from "@/lib/db";
import { isIgdbConfigured } from "@/lib/igdb/igdb-client";
import { lookupReleaseDates } from "@/lib/igdb/release-date-lookup";

/** IGDB is asked about a few games per pass, so a long wishlist is spread over several passes. */
const CHECKS_PER_PASS = 20;

/** Refreshes the release dates of the wished games that are due; returns how many IGDB answered for. */
export async function refreshWishlistReleaseDates(now: Date, lookup = lookupReleaseDates): Promise<number> {
  if (!isIgdbConfigured()) return 0;
  const due = listWishlistReleaseChecksDue(now, CHECKS_PER_PASS);
  if (due.length === 0) return 0;
  const found = await lookup(due);
  saveReleaseDates(found, now);
  return found.size;
}
