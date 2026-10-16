import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  encryptSecret,
  decryptSecret,
  hashPassword,
  verifyPassword,
} from "./crypto";
import type {
  User,
  PlatformAccount,
  PlatformType,
  OwnedGame,
  UserGameProgress,
  Collection,
  DuplicateGameGroup,
  DatabaseSyncPayload,
} from "./types";

let dbInstance: DatabaseSync | null = null;

export function getDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    const customPath = process.env.DATABASE_PATH;
    const customDir = path.dirname(customPath);
    if (!fs.existsSync(customDir)) {
      try {
        fs.mkdirSync(customDir, { recursive: true });
      } catch {
        // Continue and let DatabaseSync report if inaccessible
      }
    }
    return customPath;
  }
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {
      // Continue and let DatabaseSync report if inaccessible
    }
  }
  return path.join(dataDir, "trophyhunter.db");
}

export function initDatabase(dbPath?: string): DatabaseSync {
  const targetPath = dbPath || getDatabasePath();
  const db = new DatabaseSync(targetPath);

  try {
    db.exec("PRAGMA journal_mode = WAL;");
  } catch {
    db.exec("PRAGMA journal_mode = DELETE;");
  }
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");

  // Schema initialization
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS platform_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      platform_username TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      profile_url TEXT,
      encrypted_api_key TEXT,
      stats_json TEXT,
      connected_at TEXT NOT NULL,
      last_synced_at TEXT,
      UNIQUE(user_id, platform)
    );

    CREATE INDEX IF NOT EXISTS idx_platform_accounts_user ON platform_accounts(user_id);

    CREATE TABLE IF NOT EXISTS user_games (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      app_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      name TEXT NOT NULL,
      header_img TEXT,
      total_achievements INTEGER NOT NULL DEFAULT 0,
      unlocked_count INTEGER NOT NULL DEFAULT 0,
      playtime_hours REAL DEFAULT 0,
      last_played TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      is_wishlist INTEGER NOT NULL DEFAULT 0,
      source TEXT,
      added_at TEXT NOT NULL,
      UNIQUE(user_id, platform, app_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_games_user ON user_games(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_games_lookup ON user_games(user_id, platform, app_id);

    CREATE TABLE IF NOT EXISTS user_game_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      app_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      unlocked_ids_json TEXT NOT NULL DEFAULT '[]',
      notes_json TEXT NOT NULL DEFAULT '{}',
      last_played TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, platform, app_id)
    );

    CREATE INDEX IF NOT EXISTS idx_progress_lookup ON user_game_progress(user_id, platform, app_id);

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      icon TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, name COLLATE NOCASE)
    );

    CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);

    CREATE TABLE IF NOT EXISTS collection_games (
      collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      user_game_id TEXT NOT NULL REFERENCES user_games(id) ON DELETE CASCADE,
      added_at TEXT NOT NULL,
      PRIMARY KEY(collection_id, user_game_id)
    );
  `);

  return db;
}

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = initDatabase();
  }
  return dbInstance;
}

export function setDbForTesting(db: DatabaseSync | null): void {
  dbInstance = db;
}

let txDepth = 0;

export function withTransaction<T>(db: DatabaseSync, fn: () => T): T {
  const isOuter = txDepth === 0;
  const savepointName = `sp_${txDepth}`;
  txDepth++;

  if (isOuter) {
    db.exec("BEGIN");
  } else {
    db.exec(`SAVEPOINT ${savepointName}`);
  }

  try {
    const result = fn();
    if (isOuter) {
      db.exec("COMMIT");
    } else {
      db.exec(`RELEASE SAVEPOINT ${savepointName}`);
    }
    return result;
  } catch (err) {
    if (isOuter) {
      db.exec("ROLLBACK");
    } else {
      db.exec(`ROLLBACK TO SAVEPOINT ${savepointName}`);
    }
    throw err;
  } finally {
    txDepth--;
  }
}


// -------------------------------------------------------------
// USER & AUTH
// -------------------------------------------------------------

export function createUser(
  username: string,
  plainPassword: string,
  displayName?: string,
  avatarUrl?: string
): User {
  const db = getDb();
  const trimmedUser = username.trim().toLowerCase();
  if (!trimmedUser || trimmedUser.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }
  if (!plainPassword || plainPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(trimmedUser);
  if (existing) {
    throw new Error("Username already taken");
  }

  const id = crypto.randomUUID();
  const passwordHash = hashPassword(plainPassword);
  const now = new Date().toISOString();
  const name = displayName?.trim() || username.trim();

  db.prepare(
    `INSERT INTO users (id, username, password_hash, display_name, avatar_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, trimmedUser, passwordHash, name, avatarUrl || null, now, now);

  return {
    id,
    username: trimmedUser,
    displayName: name,
    avatarUrl: avatarUrl || undefined,
    createdAt: now,
  };
}

export function authenticateUser(
  username: string,
  plainPassword: string
): User | null {
  const db = getDb();
  const trimmed = username.trim().toLowerCase();
  const row = db
    .prepare(
      "SELECT id, username, password_hash, display_name, avatar_url, created_at FROM users WHERE username = ?"
    )
    .get(trimmed) as
    | {
        id: string;
        username: string;
        password_hash: string;
        display_name: string;
        avatar_url: string | null;
        created_at: string;
      }
    | undefined;

  if (!row) return null;

  const valid = verifyPassword(plainPassword, row.password_hash);
  if (!valid) return null;

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url || undefined,
    createdAt: row.created_at,
  };
}

export function createSession(userId: string, expiresInDays = 30): string {
  const db = getDb();
  const sessionId = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + expiresInDays * 24 * 60 * 60 * 1000
  ).toISOString();

  db.prepare(
    "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
  ).run(sessionId, userId, expiresAt, now.toISOString());

  return sessionId;
}

export function validateSession(sessionId: string): User | null {
  if (!sessionId) return null;
  const db = getDb();
  const now = new Date().toISOString();

  const row = db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.created_at, s.expires_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`
    )
    .get(sessionId) as
    | {
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
        created_at: string;
        expires_at: string;
      }
    | undefined;

  if (!row) return null;

  if (row.expires_at < now) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url || undefined,
    createdAt: row.created_at,
  };
}

export function deleteSession(sessionId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function getUserById(userId: string): User | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, username, display_name, avatar_url, created_at FROM users WHERE id = ?"
    )
    .get(userId) as
    | {
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
        created_at: string;
      }
    | undefined;

  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url || undefined,
    createdAt: row.created_at,
  };
}

// -------------------------------------------------------------
// PLATFORM ACCOUNTS & ENCRYPTED KEYS
// -------------------------------------------------------------

export function getUserPlatformAccounts(
  userId: string
): Partial<Record<PlatformType, PlatformAccount>> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT platform, platform_username, display_name, avatar_url, profile_url, stats_json, connected_at, last_synced_at
       FROM platform_accounts WHERE user_id = ?`
    )
    .all(userId) as Array<{
    platform: PlatformType;
    platform_username: string;
    display_name: string | null;
    avatar_url: string | null;
    profile_url: string | null;
    stats_json: string | null;
    connected_at: string;
    last_synced_at: string | null;
  }>;

  const result: Partial<Record<PlatformType, PlatformAccount>> = {};

  for (const r of rows) {
    let stats = {
      gamesOwned: 0,
      totalAchievements: 0,
      completedGames: 0,
    };
    if (r.stats_json) {
      try {
        stats = JSON.parse(r.stats_json);
      } catch {
        // use default stats
      }
    }

    result[r.platform] = {
      platform: r.platform,
      username: r.platform_username,
      displayName: r.display_name || r.platform_username,
      avatarUrl: r.avatar_url || undefined,
      profileUrl: r.profile_url || undefined,
      connectedAt: r.connected_at,
      lastSyncedAt: r.last_synced_at || undefined,
      stats,
    };
  }

  return result;
}

export function saveUserPlatformAccount(
  userId: string,
  account: PlatformAccount,
  plainApiKey?: string
): void {
  const db = getDb();
  const existing = db
    .prepare(
      "SELECT id, encrypted_api_key FROM platform_accounts WHERE user_id = ? AND platform = ?"
    )
    .get(userId, account.platform) as
    | { id: string; encrypted_api_key: string | null }
    | undefined;

  let encryptedKey = existing?.encrypted_api_key || null;
  if (plainApiKey !== undefined) {
    encryptedKey = plainApiKey ? encryptSecret(plainApiKey.trim()) : null;
  }

  const statsJson = JSON.stringify(account.stats || {});
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(
      `UPDATE platform_accounts
       SET platform_username = ?, display_name = ?, avatar_url = ?, profile_url = ?,
           encrypted_api_key = ?, stats_json = ?, last_synced_at = ?
       WHERE id = ?`
    ).run(
      account.username,
      account.displayName || account.username,
      account.avatarUrl || null,
      account.profileUrl || null,
      encryptedKey,
      statsJson,
      account.lastSyncedAt || now,
      existing.id
    );
  } else {
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO platform_accounts
       (id, user_id, platform, platform_username, display_name, avatar_url, profile_url, encrypted_api_key, stats_json, connected_at, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      userId,
      account.platform,
      account.username,
      account.displayName || account.username,
      account.avatarUrl || null,
      account.profileUrl || null,
      encryptedKey,
      statsJson,
      account.connectedAt || now,
      account.lastSyncedAt || null
    );
  }
}

export function getUserPlatformApiKey(
  userId: string,
  platform: PlatformType
): string | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT encrypted_api_key FROM platform_accounts WHERE user_id = ? AND platform = ?"
    )
    .get(userId, platform) as { encrypted_api_key: string | null } | undefined;

  if (!row || !row.encrypted_api_key) return null;
  try {
    return decryptSecret(row.encrypted_api_key);
  } catch (err) {
    console.error("Failed to decrypt user platform API key:", err);
    return null;
  }
}

export function removeUserPlatformAccount(
  userId: string,
  platform: PlatformType
): void {
  const db = getDb();
  db.prepare(
    "DELETE FROM platform_accounts WHERE user_id = ? AND platform = ?"
  ).run(userId, platform);
}

// -------------------------------------------------------------
// OWNED GAMES & PROGRESS
// -------------------------------------------------------------

export function getUserOwnedGames(userId: string): OwnedGame[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT app_id, name, header_img, platform, total_achievements, unlocked_count, playtime_hours, last_played, added_at, source
       FROM user_games
       WHERE user_id = ?
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

export function saveUserOwnedGames(userId: string, games: OwnedGame[]): void {
  if (!games.length) return;
  const db = getDb();

  const insertStmt = db.prepare(
    `INSERT INTO user_games (id, user_id, app_id, platform, name, header_img, total_achievements, unlocked_count, playtime_hours, last_played, source, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, platform, app_id) DO UPDATE SET
       name = excluded.name,
       header_img = excluded.header_img,
       total_achievements = excluded.total_achievements,
       unlocked_count = excluded.unlocked_count,
       playtime_hours = COALESCE(excluded.playtime_hours, user_games.playtime_hours),
       last_played = COALESCE(excluded.last_played, user_games.last_played),
       source = COALESCE(excluded.source, user_games.source)`
  );

  withTransaction(db, () => {
    for (const g of games) {
      const id = crypto.randomUUID();
      insertStmt.run(
        id,
        userId,
        g.appId,
        g.platform,
        g.name,
        g.headerImg || null,
        g.totalAchievements || 0,
        g.unlockedCount || 0,
        g.playtimeHours ?? null,
        g.lastPlayed || null,
        g.source || null,
        g.addedAt || new Date().toISOString()
      );
    }
  });
}

export function removeUserPlatformGames(
  userId: string,
  platform: PlatformType
): void {
  const db = getDb();
  db.prepare(
    "DELETE FROM user_games WHERE user_id = ? AND platform = ?"
  ).run(userId, platform);
}

export function getUserGameProgress(
  userId: string,
  appId: number,
  platform: PlatformType = "steam"
): UserGameProgress | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT unlocked_ids_json, notes_json, last_played
       FROM user_game_progress
       WHERE user_id = ? AND app_id = ? AND platform = ?`
    )
    .get(userId, appId, platform) as
    | {
        unlocked_ids_json: string;
        notes_json: string;
        last_played: string | null;
      }
    | undefined;

  if (!row) return null;

  try {
    return {
      unlockedIds: JSON.parse(row.unlocked_ids_json || "[]"),
      notes: JSON.parse(row.notes_json || "{}"),
      lastPlayed: row.last_played || undefined,
    };
  } catch {
    return null;
  }
}

export function saveUserGameProgress(
  userId: string,
  appId: number,
  platform: PlatformType,
  progress: UserGameProgress
): void {
  const db = getDb();
  const now = new Date().toISOString();
  const unlockedJson = JSON.stringify(progress.unlockedIds || []);
  const notesJson = JSON.stringify(progress.notes || {});
  const lastPlayed = progress.lastPlayed || now;

  db.prepare(
    `INSERT INTO user_game_progress (id, user_id, app_id, platform, unlocked_ids_json, notes_json, last_played, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, platform, app_id) DO UPDATE SET
       unlocked_ids_json = excluded.unlocked_ids_json,
       notes_json = excluded.notes_json,
       last_played = excluded.last_played,
       updated_at = excluded.updated_at`
  ).run(
    crypto.randomUUID(),
    userId,
    appId,
    platform,
    unlockedJson,
    notesJson,
    lastPlayed,
    now
  );

  // Keep user_games unlocked count and last played in sync if game is present
  try {
    db.prepare(
      `UPDATE user_games
       SET unlocked_count = ?, last_played = ?
       WHERE user_id = ? AND app_id = ? AND platform = ?`
    ).run(progress.unlockedIds?.length || 0, lastPlayed, userId, appId, platform);
  } catch {
    // Non-fatal if game is not yet in user_games
  }
}

export function resetUserGameProgress(
  userId: string,
  appId: number,
  platform: PlatformType = "steam"
): void {
  const db = getDb();
  db.prepare(
    "DELETE FROM user_game_progress WHERE user_id = ? AND app_id = ? AND platform = ?"
  ).run(userId, appId, platform);
  db.prepare(
    "UPDATE user_games SET unlocked_count = 0 WHERE user_id = ? AND app_id = ? AND platform = ?"
  ).run(userId, appId, platform);
}

export function removeUserOwnedGame(
  userId: string,
  appId: number,
  platform?: PlatformType
): void {
  const db = getDb();
  if (platform) {
    db.prepare(
      "DELETE FROM user_games WHERE user_id = ? AND app_id = ? AND platform = ?"
    ).run(userId, appId, platform);
    db.prepare(
      "DELETE FROM user_game_progress WHERE user_id = ? AND app_id = ? AND platform = ?"
    ).run(userId, appId, platform);
  } else {
    db.prepare(
      "DELETE FROM user_games WHERE user_id = ? AND app_id = ?"
    ).run(userId, appId);
    db.prepare(
      "DELETE FROM user_game_progress WHERE user_id = ? AND app_id = ?"
    ).run(userId, appId);
  }
}

export function getAllUserGameProgress(
  userId: string
): Record<string, UserGameProgress> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT app_id, platform, unlocked_ids_json, notes_json, last_played
       FROM user_game_progress WHERE user_id = ?`
    )
    .all(userId) as Array<{
    app_id: number;
    platform: string;
    unlocked_ids_json: string;
    notes_json: string;
    last_played: string | null;
  }>;

  const result: Record<string, UserGameProgress> = {};
  for (const r of rows) {
    try {
      result[`${r.platform}_${r.app_id}`] = {
        unlockedIds: JSON.parse(r.unlocked_ids_json || "[]"),
        notes: JSON.parse(r.notes_json || "{}"),
        lastPlayed: r.last_played || undefined,
      };
    } catch {
      // ignore parse errors
    }
  }
  return result;
}

// -------------------------------------------------------------
// COLLECTIONS & WISHLIST
// -------------------------------------------------------------

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

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    description: r.description || undefined,
    color: r.color || undefined,
    icon: r.icon || undefined,
    createdAt: r.created_at,
    gameCount: r.game_count,
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
  const game = db
    .prepare(
      "SELECT id FROM user_games WHERE user_id = ? AND app_id = ? AND platform = ?"
    )
    .get(userId, appId, platform) as { id: string } | undefined;

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
  const game = db
    .prepare(
      "SELECT id FROM user_games WHERE user_id = ? AND app_id = ? AND platform = ?"
    )
    .get(userId, appId, platform) as { id: string } | undefined;

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
  db.prepare(
    "UPDATE user_games SET is_wishlist = ? WHERE user_id = ? AND app_id = ? AND platform = ?"
  ).run(isWishlist ? 1 : 0, userId, appId, platform);
}

export function setGameFavorite(
  userId: string,
  appId: number,
  platform: PlatformType,
  isFavorite: boolean
): void {
  const db = getDb();
  db.prepare(
    "UPDATE user_games SET is_favorite = ? WHERE user_id = ? AND app_id = ? AND platform = ?"
  ).run(isFavorite ? 1 : 0, userId, appId, platform);
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

// -------------------------------------------------------------
// DUPLICATE GAMES DETECTION
// -------------------------------------------------------------

export function normalizeGameTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(
      /\b(game of the year edition|goty edition|definitive edition|director's cut|remastered|enhanced edition|special edition|standard edition|deluxe edition)\b/gi,
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
    // A duplicate is present if owned across 2 or more distinct platforms
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

// -------------------------------------------------------------
// LOCALSTORAGE SYNC & MIGRATION
// -------------------------------------------------------------

export function syncFromLocalStorage(
  userId: string,
  payload: DatabaseSyncPayload
): void {
  const db = getDb();

  withTransaction(db, () => {
    // 1. Sync Profile & Connected accounts
    if (payload.profile?.accounts) {
      for (const [plat, acc] of Object.entries(payload.profile.accounts)) {
        if (acc) {
          const plainKey =
            plat === "steam" && payload.steamApiKey
              ? payload.steamApiKey
              : undefined;
          saveUserPlatformAccount(userId, acc, plainKey);
        }
      }
    }

    // 2. Sync Owned Games
    if (payload.games && payload.games.length > 0) {
      saveUserOwnedGames(userId, payload.games);
    }

    // 3. Sync Progress
    if (payload.progress) {
      for (const [key, prog] of Object.entries(payload.progress)) {
        // key format might be `trophyhunter_game_42` or `steam_42` or `42`
        const parts = key.split("_");
        const appIdStr = parts[parts.length - 1];
        const appId = parseInt(appIdStr, 10);
        if (!isNaN(appId)) {
          const plat = (parts.length > 2 && ["steam", "xbox", "epic", "gog"].includes(parts[parts.length - 2]))
            ? (parts[parts.length - 2] as PlatformType)
            : "steam";
          saveUserGameProgress(userId, appId, plat, prog);
        }
      }
    }

    // 4. Sync Favorites
    if (payload.favorites && Array.isArray(payload.favorites)) {
      for (const appId of payload.favorites) {
        db.prepare(
          "UPDATE user_games SET is_favorite = 1 WHERE user_id = ? AND app_id = ?"
        ).run(userId, Number(appId));
      }
    }
  });
}
