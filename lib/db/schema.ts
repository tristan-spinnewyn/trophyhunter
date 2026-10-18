// lib/db/schema.ts
export const SCHEMA_SQL = `
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
  status TEXT NOT NULL DEFAULT 'backlog',
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
  pinned_ids_json TEXT NOT NULL DEFAULT '[]',
  hunting_meta_json TEXT,
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
`;
