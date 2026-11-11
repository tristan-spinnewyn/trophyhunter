// __tests__/db/backlog-order.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserOwnedGames,
  getUserOwnedGames,
  setUserGameStatus,
  setUserGameBacklogRank,
  setUserBacklogQueue,
} from "@/lib/db";
import { runDatabaseMigrations } from "@/lib/db/migrations";
import { makeOwnedGame } from "../helpers/gameFixtures";

describe("backlog order in the database", () => {
  let db: DatabaseSync;
  let userId: string;

  const rankOf = (appId: number) => getUserOwnedGames(userId).find((g) => g.appId === appId)?.backlogRank;

  beforeEach(() => {
    db = initDatabase(":memory:");
    setDbForTesting(db);
    userId = createUser("QueueOwner", "password123").id;
    saveUserOwnedGames(userId, [
      makeOwnedGame({ appId: 1, name: "Hades", status: "backlog" }),
      makeOwnedGame({ appId: 2, name: "Celeste", status: "backlog" }),
    ]);
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("stores no rank until a game is queued, then returns it with the game", () => {
    expect(rankOf(1)).toBeUndefined();

    setUserGameBacklogRank(userId, 1, "steam", -2);

    expect(rankOf(1)).toBe(-2);
    expect(rankOf(2)).toBeUndefined();
  });

  it("takes a game out of the queue when its rank is cleared", () => {
    setUserGameBacklogRank(userId, 1, "steam", 0);
    setUserGameBacklogRank(userId, 1, "steam", null);

    expect(rankOf(1)).toBeUndefined();
  });

  it("keeps the rank when a platform sync saves the game again without one", () => {
    setUserGameBacklogRank(userId, 1, "steam", 4);

    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 1, name: "Hades", unlockedCount: 6 })]);

    expect(rankOf(1)).toBe(4);
  });

  it("saves the rank sent with a game, as when a platform is replaced", () => {
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 3, name: "Tunic", status: "backlog", backlogRank: 7 })]);

    expect(rankOf(3)).toBe(7);
  });

  it("forgets the rank once the game leaves the backlog", () => {
    setUserGameBacklogRank(userId, 1, "steam", 0);

    setUserGameStatus(userId, 1, "steam", "in-progress");
    setUserGameStatus(userId, 1, "steam", "backlog");

    expect(rankOf(1)).toBeUndefined();
  });

  it("adds the rank column to a database created before the queue existed", () => {
    db.exec("ALTER TABLE user_games DROP COLUMN backlog_rank;");

    runDatabaseMigrations(db);
    setUserGameBacklogRank(userId, 2, "steam", 1);

    expect(rankOf(2)).toBe(1);
  });

  it("stores a whole queue in its order and takes the other backlog games out of it", () => {
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 3, name: "Tunic", status: "backlog", platform: "gog" })]);
    setUserGameBacklogRank(userId, 1, "steam", 0);

    setUserBacklogQueue(userId, [
      { appId: 3, platform: "gog" },
      { appId: 2, platform: "steam" },
    ]);

    expect([rankOf(3), rankOf(2), rankOf(1)]).toEqual([0, 1, undefined]);
  });

  it("only queues games that are in the backlog", () => {
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 4, name: "Doom", status: "completed" })]);

    setUserBacklogQueue(userId, [{ appId: 4, platform: "steam" }]);

    expect(rankOf(4)).toBeUndefined();
  });
});
