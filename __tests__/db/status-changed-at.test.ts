// __tests__/db/status-changed-at.test.ts
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

describe("status change date in the database", () => {
  let db: DatabaseSync;
  let userId: string;

  const changedAt = (appId: number) => getUserOwnedGames(userId).find((g) => g.appId === appId)?.statusChangedAt;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-10T12:00:00.000Z"));
    db = initDatabase(":memory:");
    setDbForTesting(db);
    userId = createUser("DateOwner", "password123").id;
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 1, name: "Hades" })]);
  });

  afterEach(() => {
    vi.useRealTimers();
    setDbForTesting(null);
  });

  it("has no date for a game whose status was never chosen", () => {
    expect(changedAt(1)).toBeUndefined();
  });

  it("stamps the moment a status is chosen, again on each change", () => {
    setUserGameStatus(userId, 1, "steam", "backlog");
    expect(changedAt(1)).toBe("2026-11-10T12:00:00.000Z");

    vi.setSystemTime(new Date("2026-11-12T08:00:00.000Z"));
    setUserGameStatus(userId, 1, "steam", "backlog");
    expect(changedAt(1)).toBe("2026-11-12T08:00:00.000Z");
  });

  it("stamps a game created by choosing its status", () => {
    setUserGameStatus(userId, 99, "gog", "backlog", "Tunic");

    expect(changedAt(99)).toBe("2026-11-10T12:00:00.000Z");
  });

  it("keeps the date when a platform sync saves the game again without one", () => {
    setUserGameStatus(userId, 1, "steam", "backlog");
    vi.setSystemTime(new Date("2026-11-15T08:00:00.000Z"));

    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 1, name: "Hades", lastPlayed: "2026-11-14T20:00:00.000Z" })]);

    expect(changedAt(1)).toBe("2026-11-10T12:00:00.000Z");
  });

  it("saves the date sent with a game, as when a platform is replaced", () => {
    saveUserOwnedGames(userId, [
      makeOwnedGame({ appId: 3, name: "Tunic", status: "backlog", statusChangedAt: "2026-10-01T00:00:00.000Z" }),
    ]);

    expect(changedAt(3)).toBe("2026-10-01T00:00:00.000Z");
  });

  it("adds the column to an older database and dates existing statuses from the upgrade", () => {
    db.exec("ALTER TABLE user_games DROP COLUMN status_changed_at;");

    runDatabaseMigrations(db);

    expect(changedAt(1)).toBe("2026-11-10T12:00:00.000Z");
  });
});
