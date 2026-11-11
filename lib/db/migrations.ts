// lib/db/migrations.ts

import type { DatabaseSync } from "node:sqlite";
import { SESSIONS_TABLE_SQL } from "./schema";

interface SqliteColumnInfo {
  readonly name: string;
}

/** Bumped by each one-shot data migration, stored in SQLite's `PRAGMA user_version`. */
const EXPLICIT_BACKLOG_VERSION = 1;
const WISHLIST_TABLE_VERSION = 2;

function getSchemaVersion(db: DatabaseSync): number {
  const row = db.prepare("PRAGMA user_version").get() as { readonly user_version?: number } | undefined;
  return row?.user_version ?? 0;
}

/**
 * "backlog" used to be the status every imported game received, so nothing in it was chosen.
 * Those games become "unsorted" once; from then on the backlog only holds what the owner puts there.
 */
function moveImplicitBacklogToUnsorted(db: DatabaseSync): void {
  if (getSchemaVersion(db) >= EXPLICIT_BACKLOG_VERSION) return;
  db.exec("UPDATE user_games SET status = 'unsorted' WHERE status = 'backlog';");
  db.exec(`PRAGMA user_version = ${EXPLICIT_BACKLOG_VERSION};`);
}

/** The wishlist used to be a flag on collection games; flagged games move to the wishlist table once. */
function moveWishlistFlagsToTable(db: DatabaseSync): void {
  if (getSchemaVersion(db) >= WISHLIST_TABLE_VERSION) return;
  const hasWishlistTable = getTableColumnNames(db, "user_wishlist").size > 0;
  if (hasWishlistTable && getTableColumnNames(db, "user_games").has("is_wishlist")) {
    db.exec(
      `INSERT OR IGNORE INTO user_wishlist (user_id, app_id, platform, name, header_img, added_at)
       SELECT user_id, app_id, platform, name, header_img, added_at FROM user_games WHERE is_wishlist = 1;`
    );
  }
  db.exec(`PRAGMA user_version = ${WISHLIST_TABLE_VERSION};`);
}

function getTableColumnNames(db: DatabaseSync, tableName: string): Set<string> {
  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as unknown as SqliteColumnInfo[];
  return new Set(columns.map((col) => col.name));
}

export function runDatabaseMigrations(db: DatabaseSync): void {
  // Earlier versions stored the plain session token. Those rows cannot be hashed back into
  // usable sessions, so the table is rebuilt and everyone signs in again once.
  if (getTableColumnNames(db, "sessions").has("id")) {
    db.exec("DROP TABLE sessions;");
    db.exec(SESSIONS_TABLE_SQL);
  }

  const gameCols = getTableColumnNames(db, "user_games");
  if (!gameCols.has("status")) {
    db.exec("ALTER TABLE user_games ADD COLUMN status TEXT NOT NULL DEFAULT 'unsorted';");
  }
  if (!gameCols.has("backlog_rank")) {
    db.exec("ALTER TABLE user_games ADD COLUMN backlog_rank INTEGER;");
  }
  if (!gameCols.has("status_changed_at")) {
    db.exec("ALTER TABLE user_games ADD COLUMN status_changed_at TEXT;");
    // Statuses chosen before the upgrade count as chosen now: only later sessions are "since then".
    db.prepare("UPDATE user_games SET status_changed_at = ?").run(new Date().toISOString());
  }
  if (!gameCols.has("completed_at")) {
    // No date is invented for games finished before: they stay "finished at an unknown date".
    db.exec("ALTER TABLE user_games ADD COLUMN completed_at TEXT;");
  }
  if (!gameCols.has("abandoned_at")) {
    // Like finish dates, no date is invented for games abandoned before.
    db.exec("ALTER TABLE user_games ADD COLUMN abandoned_at TEXT;");
  }
  if (!gameCols.has("rating")) {
    db.exec("ALTER TABLE user_games ADD COLUMN rating INTEGER;");
  }
  if (!gameCols.has("review")) {
    db.exec("ALTER TABLE user_games ADD COLUMN review TEXT;");
  }
  moveImplicitBacklogToUnsorted(db);
  moveWishlistFlagsToTable(db);

  const wishlistCols = getTableColumnNames(db, "user_wishlist");
  for (const [column, type] of [
    ["target_price_cents", "INTEGER"],
    ["last_price_cents", "INTEGER"],
    ["currency", "TEXT"],
    ["price_checked_at", "TEXT"],
  ] as const) {
    if (wishlistCols.size > 0 && !wishlistCols.has(column)) {
      db.exec(`ALTER TABLE user_wishlist ADD COLUMN ${column} ${type};`);
    }
  }

  const progressCols = getTableColumnNames(db, "user_game_progress");
  if (!progressCols.has("pinned_ids_json")) {
    db.exec("ALTER TABLE user_game_progress ADD COLUMN pinned_ids_json TEXT NOT NULL DEFAULT '[]';");
  }
  if (!progressCols.has("hunting_meta_json")) {
    db.exec("ALTER TABLE user_game_progress ADD COLUMN hunting_meta_json TEXT;");
  }
}
