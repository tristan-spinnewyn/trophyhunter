// lib/db/wishlist.ts
import { getDb } from "./connection";
import type { PlatformType, WishlistEntry, WishlistGameDetails } from "../types";

/**
 * Adds a game to the wishlist, owned or not; removing it forgets it on every platform.
 * A game without a given name takes the one it has in the collection.
 */
export function setGameWishlist(
  userId: string,
  appId: number,
  platform: PlatformType,
  isWishlist: boolean,
  details: WishlistGameDetails = {}
): void {
  const db = getDb();
  if (!isWishlist) {
    db.prepare("DELETE FROM user_wishlist WHERE user_id = ? AND app_id = ?").run(userId, appId);
    return;
  }
  const owned = db
    .prepare("SELECT name, header_img FROM user_games WHERE user_id = ? AND app_id = ? ORDER BY platform = ? DESC LIMIT 1")
    .get(userId, appId, platform) as { readonly name: string; readonly header_img: string | null } | undefined;
  db.prepare(
    `INSERT INTO user_wishlist (user_id, app_id, platform, name, header_img, added_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, app_id) DO UPDATE SET
       name = excluded.name,
       header_img = COALESCE(excluded.header_img, user_wishlist.header_img)`
  ).run(
    userId,
    appId,
    platform,
    details.name || owned?.name || `Game ${appId}`,
    details.headerImg || owned?.header_img || null,
    new Date().toISOString()
  );
}

/** Wishes for games known only by id, as sent by a device: each takes its platform from the collection. */
export function addWishlistIds(userId: string, appIds: readonly number[]): void {
  const findPlatform = getDb().prepare("SELECT platform FROM user_games WHERE user_id = ? AND app_id = ? LIMIT 1");
  for (const appId of appIds) {
    const owned = findPlatform.get(userId, appId) as { readonly platform: PlatformType } | undefined;
    setGameWishlist(userId, appId, owned?.platform ?? "steam", true);
  }
}

export function setGameFavorite(
  userId: string,
  appId: number,
  platform: PlatformType,
  isFavorite: boolean
): void {
  const db = getDb();
  const res = db
    .prepare(
      "UPDATE user_games SET is_favorite = ? WHERE user_id = ? AND app_id = ? AND platform = ?"
    )
    .run(isFavorite ? 1 : 0, userId, appId, platform);

  if (res.changes === 0) {
    db.prepare(
      "UPDATE user_games SET is_favorite = ? WHERE user_id = ? AND app_id = ?"
    ).run(isFavorite ? 1 : 0, userId, appId);
  }
}

export function getUserFavoriteAppIds(userId: string): number[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT DISTINCT app_id FROM user_games WHERE user_id = ? AND is_favorite = 1"
    )
    .all(userId) as Array<{ app_id: number }>;
  return rows.map((r) => r.app_id);
}

export type { WishlistEntry };

export function getUserWishlist(userId: string): WishlistEntry[] {
  const rows = getDb()
    .prepare(
      `SELECT w.app_id, w.platform, w.name, w.header_img, w.added_at, w.target_price_cents, w.last_price_cents, w.currency, w.price_checked_at,
              r.release_date
       FROM user_wishlist w
       LEFT JOIN game_release_dates r ON r.platform = w.platform AND r.app_id = w.app_id
       WHERE w.user_id = ?
       ORDER BY w.added_at DESC, w.app_id`
    )
    .all(userId) as Array<{
    app_id: number;
    platform: PlatformType;
    name: string;
    header_img: string | null;
    added_at: string;
    target_price_cents: number | null;
    last_price_cents: number | null;
    currency: string | null;
    price_checked_at: string | null;
    release_date: string | null;
  }>;

  return rows.map((r) => ({
    appId: r.app_id,
    platform: r.platform,
    name: r.name,
    headerImg: r.header_img || "",
    addedAt: r.added_at,
    targetPriceCents: r.target_price_cents ?? undefined,
    lastPriceCents: r.last_price_cents ?? undefined,
    currency: r.currency ?? undefined,
    priceCheckedAt: r.price_checked_at ?? undefined,
    releaseDate: r.release_date ?? undefined,
  }));
}
