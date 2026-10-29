// lib/db/migrations.ts

import type { DatabaseSync } from "node:sqlite";
import { SESSIONS_TABLE_SQL } from "./schema";

interface SqliteColumnInfo {
  readonly name: string;
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
    db.exec("ALTER TABLE user_games ADD COLUMN status TEXT NOT NULL DEFAULT 'backlog';");
  }

  const progressCols = getTableColumnNames(db, "user_game_progress");
  if (!progressCols.has("pinned_ids_json")) {
    db.exec("ALTER TABLE user_game_progress ADD COLUMN pinned_ids_json TEXT NOT NULL DEFAULT '[]';");
  }
  if (!progressCols.has("hunting_meta_json")) {
    db.exec("ALTER TABLE user_game_progress ADD COLUMN hunting_meta_json TEXT;");
  }
}
