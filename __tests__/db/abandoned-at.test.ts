// __tests__/db/abandoned-at.test.ts
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

describe("abandon date in the database", () => {
  let db: DatabaseSync;
  let userId: string;

  const abandonedAt = (appId: number) => getUserOwnedGames(userId).find((g) => g.appId === appId)?.abandonedAt;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T12:00:00.000Z"));
    db = initDatabase(":memory:");
    setDbForTesting(db);
    userId = createUser("Quitter", "password123").id;
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 1, name: "Starfield" })]);
  });

  afterEach(() => {
    vi.useRealTimers();
    setDbForTesting(null);
  });

  it("stamps the moment a game is abandoned, including a game created that way", () => {
    setUserGameStatus(userId, 1, "steam", "abandoned");
    setUserGameStatus(userId, 99, "gog", "abandoned", "Anthem");

    expect(abandonedAt(1)).toBe("2026-11-11T12:00:00.000Z");
    expect(abandonedAt(99)).toBe("2026-11-11T12:00:00.000Z");
  });

  it("has no abandon date for other statuses and keeps the last one when picked up again", () => {
    setUserGameStatus(userId, 1, "steam", "paused");
    expect(abandonedAt(1)).toBeUndefined();

    setUserGameStatus(userId, 1, "steam", "abandoned");
    vi.setSystemTime(new Date("2027-01-01T00:00:00.000Z"));
    setUserGameStatus(userId, 1, "steam", "in-progress");
    expect(abandonedAt(1)).toBe("2026-11-11T12:00:00.000Z");
  });

  it("keeps the date across syncs and saves one sent with a game", () => {
    setUserGameStatus(userId, 1, "steam", "abandoned");
    saveUserOwnedGames(userId, [
      makeOwnedGame({ appId: 1, name: "Starfield" }),
      makeOwnedGame({ appId: 3, name: "Anthem", status: "abandoned", abandonedAt: "2025-04-01T00:00:00.000Z" }),
    ]);

    expect(abandonedAt(1)).toBe("2026-11-11T12:00:00.000Z");
    expect(abandonedAt(3)).toBe("2025-04-01T00:00:00.000Z");
  });

  it("adds the column to an older database", () => {
    db.exec("ALTER TABLE user_games DROP COLUMN abandoned_at;");

    runDatabaseMigrations(db);

    setUserGameStatus(userId, 1, "steam", "abandoned");
    expect(abandonedAt(1)).toBe("2026-11-11T12:00:00.000Z");
  });
});
