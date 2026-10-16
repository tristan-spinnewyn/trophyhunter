// lib/db/collections-games.ts
import { getDb } from "./connection";
import type { OwnedGame, PlatformType } from "../types";

export function addGameToCollection(
  userId: string,
  collectionId: string,
  appId: number,
  platform: PlatformType
): void {
  const db = getDb();
  let game = db
    .prepare("SELECT id FROM user_games WHERE user_id = ? AND app_id = ? AND platform = ?")
    .get(userId, appId, platform) as { id: string } | undefined;

  if (!game) {
    game = db
      .prepare("SELECT id FROM user_games WHERE user_id = ? AND app_id = ? LIMIT 1")
      .get(userId, appId) as { id: string } | undefined;
  }

  if (!game) throw new Error("Game not found in user library");

  const collection = db
    .prepare("SELECT id FROM collections WHERE id = ? AND user_id = ?")
    .get(collectionId, userId);

  if (!collection) throw new Error("Collection not found");

  db.prepare(
    "INSERT OR IGNORE INTO collection_games (collection_id, user_game_id, added_at) VALUES (?, ?, ?)"
  ).run(collectionId, game.id, new Date().toISOString());
}

export function removeGameFromCollection(
  userId: string,
  collectionId: string,
  appId: number,
  platform: PlatformType
): void {
  const db = getDb();
  let game = db
    .prepare("SELECT id FROM user_games WHERE user_id = ? AND app_id = ? AND platform = ?")
    .get(userId, appId, platform) as { id: string } | undefined;

  if (!game) {
    game = db
      .prepare("SELECT id FROM user_games WHERE user_id = ? AND app_id = ? LIMIT 1")
      .get(userId, appId) as { id: string } | undefined;
  }

  if (!game) return;

  db.prepare(
    `DELETE FROM collection_games
     WHERE collection_id IN (SELECT id FROM collections WHERE id = ? AND user_id = ?)
       AND user_game_id = ?`
  ).run(collectionId, userId, game.id);
}

export function getCollectionGames(userId: string, collectionId: string): OwnedGame[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT ug.app_id, ug.name, ug.header_img, ug.platform, ug.total_achievements,
              ug.unlocked_count, ug.playtime_hours, ug.last_played, ug.added_at, ug.source
       FROM collection_games cg
       JOIN user_games ug ON cg.user_game_id = ug.id
       JOIN collections c ON cg.collection_id = c.id
       WHERE c.id = ? AND c.user_id = ?
       ORDER BY cg.added_at DESC`
    )
    .all(collectionId, userId) as Array<{
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
