// __tests__/db/completed-at.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserOwnedGames,
  getUserOwnedGames,
  setUserGameStatus,
} from "@/lib/db";
import { runDatabaseMigrations } from "@/lib/db/migrations";
import { makeOwnedGame } from "../helpers/gameFixtures";

describe("completion date in the database", () => {
  let db: DatabaseSync;
  let userId: string;

  const completedAt = (appId: number) => getUserOwnedGames(userId).find((g) => g.appId === appId)?.completedAt;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T12:00:00.000Z"));
    db = initDatabase(":memory:");
    setDbForTesting(db);
    userId = createUser("Finisher", "password123").id;
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 1, name: "Hades" })]);
  });

  afterEach(() => {
    vi.useRealTimers();
    setDbForTesting(null);
  });

  it("has no completion date for a game that was never finished", () => {
    setUserGameStatus(userId, 1, "steam", "in-progress");

    expect(completedAt(1)).toBeUndefined();
  });

  it("stamps the moment a game is marked finished", () => {
    setUserGameStatus(userId, 1, "steam", "completed");

    expect(completedAt(1)).toBe("2026-11-11T12:00:00.000Z");
  });

  it("stamps a game created by marking it finished", () => {
    setUserGameStatus(userId, 99, "gog", "completed", "Tunic");

    expect(completedAt(99)).toBe("2026-11-11T12:00:00.000Z");
  });

  it("keeps the last completion date when the game is picked up again, and renews it on the next finish", () => {
    setUserGameStatus(userId, 1, "steam", "completed");
    vi.setSystemTime(new Date("2027-02-01T08:00:00.000Z"));
    setUserGameStatus(userId, 1, "steam", "in-progress");
    expect(completedAt(1)).toBe("2026-11-11T12:00:00.000Z");

    vi.setSystemTime(new Date("2027-03-01T08:00:00.000Z"));
    setUserGameStatus(userId, 1, "steam", "completed");
    expect(completedAt(1)).toBe("2027-03-01T08:00:00.000Z");
  });

  it("keeps the date when a platform sync saves the game again without one", () => {
    setUserGameStatus(userId, 1, "steam", "completed");

    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 1, name: "Hades", lastPlayed: "2026-11-12T20:00:00.000Z" })]);

    expect(completedAt(1)).toBe("2026-11-11T12:00:00.000Z");
  });

  it("saves the date sent with a game, as when a platform is replaced", () => {
    saveUserOwnedGames(userId, [
      makeOwnedGame({ appId: 3, name: "Celeste", status: "completed", completedAt: "2025-04-01T00:00:00.000Z" }),
    ]);

    expect(completedAt(3)).toBe("2025-04-01T00:00:00.000Z");
  });

  it("adds the column to an older database without inventing a date for games finished before", () => {
    setUserGameStatus(userId, 1, "steam", "completed");
    db.exec("ALTER TABLE user_games DROP COLUMN completed_at;");

    runDatabaseMigrations(db);

    expect(completedAt(1)).toBeUndefined();
  });
});
