// lib/db/schema.ts

/** Sessions are keyed by a SHA-256 hash of the cookie token, never by the token itself. */
export const SESSIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
`;

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
${SESSIONS_TABLE_SQL}
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
  status TEXT NOT NULL DEFAULT 'unsorted',
  backlog_rank INTEGER,
  status_changed_at TEXT,
  completed_at TEXT,
  source TEXT,
  added_at TEXT NOT NULL,
  UNIQUE(user_id, platform, app_id)
);
CREATE INDEX IF NOT EXISTS idx_user_games_user ON user_games(user_id);
CREATE INDEX IF NOT EXISTS idx_user_games_lookup ON user_games(user_id, platform, app_id);

-- Play sessions, deduced from the playtime a sync brings compared to the previous one.
CREATE TABLE IF NOT EXISTS play_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  app_id INTEGER NOT NULL,
  minutes INTEGER NOT NULL,
  detected_at TEXT NOT NULL,
  last_played TEXT
);
CREATE INDEX IF NOT EXISTS idx_play_sessions_user_date ON play_sessions(user_id, detected_at);

-- Per-user preferences; a missing row means the defaults.
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  auto_sync_hours INTEGER,
  stale_after_weeks INTEGER NOT NULL DEFAULT 6,
  last_auto_sync_at TEXT,
  updated_at TEXT NOT NULL
);

-- Games wished for, owned or not yet: a wishlist outlives the collection it may later join.
CREATE TABLE IF NOT EXISTS user_wishlist (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  name TEXT NOT NULL,
  header_img TEXT,
  added_at TEXT NOT NULL,
  PRIMARY KEY (user_id, app_id)
);

-- How long games take to beat, from IGDB: game data shared by every user, refreshed now and then.
CREATE TABLE IF NOT EXISTS game_time_to_beat (
  platform TEXT NOT NULL,
  app_id INTEGER NOT NULL,
  igdb_game_id INTEGER,
  hastily_seconds INTEGER,
  normally_seconds INTEGER,
  completely_seconds INTEGER,
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (platform, app_id)
);
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
