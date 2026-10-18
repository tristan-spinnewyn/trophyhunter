// lib/db/migrations.ts

import type { DatabaseSync } from "node:sqlite";

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
