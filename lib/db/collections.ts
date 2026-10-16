import crypto from "node:crypto";
import { getDb, withTransaction } from "./connection";
import { getUserOwnedGames } from "./games";
import type {
  Collection,
  DuplicateGameGroup,
  OwnedGame,
  PlatformType,
} from "../types";

export function getUserCollections(userId: string): Collection[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.id, c.user_id, c.name, c.description, c.color, c.icon, c.created_at,
              COUNT(cg.user_game_id) as game_count
       FROM collections c
       LEFT JOIN collection_games cg ON c.id = cg.collection_id
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY c.created_at ASC`
    )
    .all(userId) as Array<{
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    created_at: string;
    game_count: number;
  }>;

  const gameLinks = db
    .prepare(
      `SELECT cg.collection_id, ug.app_id
       FROM collection_games cg
       JOIN user_games ug ON cg.user_game_id = ug.id
       JOIN collections c ON cg.collection_id = c.id
       WHERE c.user_id = ?`
    )
    .all(userId) as Array<{ collection_id: string; app_id: number }>;

  const gameIdsByColl = new Map<string, number[]>();
  for (const link of gameLinks) {
    const list = gameIdsByColl.get(link.collection_id) || [];
    if (!list.includes(link.app_id)) {
      list.push(link.app_id);
      gameIdsByColl.set(link.collection_id, list);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    description: r.description || undefined,
    color: r.color || undefined,
    icon: r.icon || undefined,
    createdAt: r.created_at,
    gameCount: r.game_count,
    gameIds: gameIdsByColl.get(r.id) || [],
  }));
}

export function createCollection(
  userId: string,
  name: string,
  description?: string,
  color?: string,
  icon?: string
): Collection {
  const db = getDb();
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Collection name cannot be empty");
  }

  const existing = db
    .prepare("SELECT id, created_at FROM collections WHERE user_id = ? AND name = ? COLLATE NOCASE")
    .get(userId, trimmed) as { id: string; created_at: string } | undefined;

  if (existing) {
    return {
      id: existing.id,
      userId,
      name: trimmed,
      description: description?.trim() || undefined,
      color: color || undefined,
      icon: icon || undefined,
      createdAt: existing.created_at,
      gameCount: 0,
      gameIds: [],
    };
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO collections (id, user_id, name, description, color, icon, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    trimmed,
    description?.trim() || null,
    color || null,
    icon || null,
    now
  );

  return {
    id,
    userId,
    name: trimmed,
    description: description?.trim() || undefined,
    color: color || undefined,
    icon: icon || undefined,
    createdAt: now,
    gameCount: 0,
    gameIds: [],
  };
}

export function deleteCollection(userId: string, collectionId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM collections WHERE id = ? AND user_id = ?").run(
    collectionId,
    userId
  );
}

export function addGameToCollection(
  userId: string,
  collectionId: string,
  appId: number,
  platform: PlatformType
): void {
  const db = getDb();
  let game = db
    .prepare(
      "SELECT id FROM user_games WHERE user_id = ? AND app_id = ? AND platform = ?"
    )
    .get(userId, appId, platform) as { id: string } | undefined;

  if (!game) {
    game = db
      .prepare("SELECT id FROM user_games WHERE user_id = ? AND app_id = ? LIMIT 1")
      .get(userId, appId) as { id: string } | undefined;
  }

  if (!game) {
    throw new Error("Game not found in user library");
  }

  const collection = db
    .prepare("SELECT id FROM collections WHERE id = ? AND user_id = ?")
    .get(collectionId, userId);

  if (!collection) {
    throw new Error("Collection not found");
  }

  db.prepare(
    `INSERT OR IGNORE INTO collection_games (collection_id, user_game_id, added_at)
     VALUES (?, ?, ?)`
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
    .prepare(
      "SELECT id FROM user_games WHERE user_id = ? AND app_id = ? AND platform = ?"
    )
    .get(userId, appId, platform) as { id: string } | undefined;

  if (!game) {
    game = db
      .prepare("SELECT id FROM user_games WHERE user_id = ? AND app_id = ? LIMIT 1")
      .get(userId, appId) as { id: string } | undefined;
  }

  if (!game) return;

  db.prepare(
    "DELETE FROM collection_games WHERE collection_id = ? AND user_game_id = ?"
  ).run(collectionId, game.id);
}

export function getCollectionGames(
  userId: string,
  collectionId: string
): OwnedGame[] {
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

export function clearAllUserData(userId: string): void {
  const db = getDb();
  withTransaction(db, () => {
    db.prepare("DELETE FROM collections WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM user_game_progress WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM user_games WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM platform_accounts WHERE user_id = ?").run(userId);
  });
}

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

export function getUserDuplicateGames(userId: string): DuplicateGameGroup[] {
  const games = getUserOwnedGames(userId);
  const groups = new Map<string, OwnedGame[]>();

  for (const game of games) {
    const norm = normalizeGameTitle(game.name);
    if (!norm) continue;
    const existing = groups.get(norm) || [];
    existing.push(game);
    groups.set(norm, existing);
  }

  const duplicates: DuplicateGameGroup[] = [];
  for (const [normTitle, list] of groups.entries()) {
    const platforms = new Set(list.map((g) => g.platform));
    if (platforms.size > 1) {
      duplicates.push({
        normalizedTitle: normTitle,
        games: list,
      });
    }
  }

  return duplicates;
}
