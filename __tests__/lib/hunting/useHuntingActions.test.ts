// __tests__/lib/hunting/useHuntingActions.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { runDatabaseMigrations } from "@/lib/db/migrations";
import { parseProgressRow } from "@/lib/db/progress-mapper";

describe("migrations and progress-mapper hunting edge cases", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("migrates legacy tables missing status, pinned_ids_json, and hunting_meta_json", () => {
    const db = new DatabaseSync(":memory:");
    db.exec(`
      CREATE TABLE user_games (id TEXT PRIMARY KEY, app_id INTEGER NOT NULL);
      CREATE TABLE user_game_progress (id TEXT PRIMARY KEY, app_id INTEGER NOT NULL);
    `);

    runDatabaseMigrations(db);

    const gameCols = db.prepare("PRAGMA table_info(user_games)").all() as Array<{ name: string }>;
    const progCols = db.prepare("PRAGMA table_info(user_game_progress)").all() as Array<{ name: string }>;

    expect(gameCols.some((c) => c.name === "status")).toBe(true);
    expect(progCols.some((c) => c.name === "pinned_ids_json")).toBe(true);
    expect(progCols.some((c) => c.name === "hunting_meta_json")).toBe(true);
  });

  it("handles malformed JSON in parseProgressRow gracefully", () => {
    const fallback = parseProgressRow({
      unlocked_ids_json: "{invalid",
      notes_json: "{}",
      pinned_ids_json: "[]",
      hunting_meta_json: null,
      last_played: null,
    });
    expect(fallback).toEqual({ unlockedIds: [], notes: {}, pinnedIds: [] });
  });
});
