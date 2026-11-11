// __tests__/db/migrations.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { initDatabase, setDbForTesting, createUser } from "@/lib/db";
import { runDatabaseMigrations } from "@/lib/db/migrations";

describe("runDatabaseMigrations: explicit backlog", () => {
  let db: DatabaseSync;
  let userId: string;

  /** Rebuilds a database from before the backlog became a deliberate choice. */
  function seedLegacyGames(statuses: readonly string[]): void {
    const insert = db.prepare(
      "INSERT INTO user_games (id, user_id, app_id, platform, name, status, added_at) VALUES (?, ?, ?, 'steam', ?, ?, '2026-01-01')"
    );
    statuses.forEach((status, i) => insert.run(`g${i}`, userId, i, `Game ${i}`, status));
    db.exec("PRAGMA user_version = 0;");
  }

  function storedStatuses(): string[] {
    const rows = db.prepare("SELECT status FROM user_games ORDER BY app_id").all() as unknown as { status: string }[];
    return rows.map((r) => r.status);
  }

  beforeEach(() => {
    db = initDatabase(":memory:");
    setDbForTesting(db);
    userId = createUser("Owner", "password123").id;
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("moves the games left in the old default backlog to unsorted and keeps chosen statuses", () => {
    seedLegacyGames(["backlog", "in-progress", "backlog", "completed"]);

    runDatabaseMigrations(db);

    expect(storedStatuses()).toEqual(["unsorted", "in-progress", "unsorted", "completed"]);
  });

  it("runs only once, so a backlog built by hand afterwards survives the next start", () => {
    seedLegacyGames(["backlog"]);
    runDatabaseMigrations(db);

    db.prepare("UPDATE user_games SET status = 'backlog' WHERE app_id = 0").run();
    runDatabaseMigrations(db);

    expect(storedStatuses()).toEqual(["backlog"]);
  });
});

describe("runDatabaseMigrations: game reviews", () => {
  it("adds the rating and review columns to a database created before them", () => {
    const db = initDatabase(":memory:");
    db.exec("ALTER TABLE user_games DROP COLUMN rating;");
    db.exec("ALTER TABLE user_games DROP COLUMN review;");

    runDatabaseMigrations(db);

    const columns = (db.prepare("PRAGMA table_info(user_games)").all() as unknown as { name: string }[]).map((c) => c.name);
    expect(columns).toEqual(expect.arrayContaining(["rating", "review"]));
  });
});

describe("runDatabaseMigrations: resume notes", () => {
  it("adds the resume note column to a database created before it", () => {
    const db = initDatabase(":memory:");
    db.exec("ALTER TABLE user_games DROP COLUMN resume_note;");

    runDatabaseMigrations(db);

    const columns = (db.prepare("PRAGMA table_info(user_games)").all() as unknown as { name: string }[]).map((c) => c.name);
    expect(columns).toContain("resume_note");
  });
});
