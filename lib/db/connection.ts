import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

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

    CREATE TABLE IF NOT EXISTS epic_game_sandboxes (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      app_id INTEGER NOT NULL,
      sandbox_id TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(user_id, app_id)
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
