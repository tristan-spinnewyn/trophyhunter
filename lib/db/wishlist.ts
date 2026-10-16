// lib/db/wishlist.ts
import { getDb } from "./connection";
import type { OwnedGame, PlatformType } from "../types";

export function setGameWishlist(
  userId: string,
  appId: number,
  platform: PlatformType,
  isWishlist: boolean
): void {
  const db = getDb();
  const res = db
    .prepare(
      "UPDATE user_games SET is_wishlist = ? WHERE user_id = ? AND app_id = ? AND platform = ?"
    )
    .run(isWishlist ? 1 : 0, userId, appId, platform);

  if (res.changes === 0) {
    db.prepare(
      "UPDATE user_games SET is_wishlist = ? WHERE user_id = ? AND app_id = ?"
    ).run(isWishlist ? 1 : 0, userId, appId);
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

export function getUserWishlist(userId: string): OwnedGame[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT app_id, name, header_img, platform, total_achievements, unlocked_count, playtime_hours, last_played, added_at, source
       FROM user_games
       WHERE user_id = ? AND is_wishlist = 1
       ORDER BY added_at DESC`
    )
    .all(userId) as Array<{
    app_id: number;
    name: string;
    header_img: string | null;
    platform: PlatformType;
    total_achievements: number;
    unlocked_count: number;
    playtime_hours: number | null;
    last_played: string | null;
    added_at: string;
    source: string | null;
  }>;

  return rows.map((r) => ({
    appId: r.app_id,
    name: r.name,
    headerImg: r.header_img || "",
    platform: r.platform,
    totalAchievements: r.total_achievements,
    unlockedCount: r.unlocked_count,
    playtimeHours: r.playtime_hours ?? undefined,
    lastPlayed: r.last_played ?? undefined,
    addedAt: r.added_at,
    source: (r.source as OwnedGame["source"]) || undefined,
  }));
}
