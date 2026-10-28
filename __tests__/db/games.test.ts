// __tests__/db/games.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserOwnedGames,
  getUserOwnedGames,
  removeUserPlatformGames,
} from "@/lib/db";
import type { OwnedGame } from "@/lib/types";

describe("Database Owned Games", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("saves, retrieves and removes owned games", () => {
    const user = createUser("GamesUser", "password123");
    const games: OwnedGame[] = [
      {
        appId: 10,
        name: "Counter-Strike",
        headerImg: "https://example.com/cs.jpg",
        platform: "steam",
        totalAchievements: 0,
        unlockedCount: 0,
        playtimeHours: 50,
        addedAt: new Date().toISOString(),
      },
      {
        appId: 20,
        name: "Team Fortress Classic",
        headerImg: "https://example.com/tfc.jpg",
        platform: "steam",
        totalAchievements: 10,
        unlockedCount: 5,
        playtimeHours: 20,
        addedAt: new Date().toISOString(),
      },
    ];

    saveUserOwnedGames(user.id, games);

    const retrieved = getUserOwnedGames(user.id);
    expect(retrieved.length).toBe(2);
    expect(retrieved.some((g) => g.name === "Counter-Strike")).toBe(true);

    removeUserPlatformGames(user.id, "steam");
    expect(getUserOwnedGames(user.id).length).toBe(0);
  });

  it("never moves the last activity back when an older import arrives", () => {
    const user = createUser("LastPlayedUser", "password123");
    const game = (lastPlayed?: string): OwnedGame => ({
      appId: 77, name: "Hades", headerImg: "", platform: "steam",
      totalAchievements: 10, unlockedCount: 0, addedAt: "2026-01-01", lastPlayed,
    });
    const lastPlayed = () => getUserOwnedGames(user.id)[0].lastPlayed;

    saveUserOwnedGames(user.id, [game("2026-09-01T00:00:00.000Z")]);
    saveUserOwnedGames(user.id, [game("2026-02-01T00:00:00.000Z")]);
    expect(lastPlayed()).toBe("2026-09-01T00:00:00.000Z");

    saveUserOwnedGames(user.id, [game(undefined)]);
    expect(lastPlayed()).toBe("2026-09-01T00:00:00.000Z");

    saveUserOwnedGames(user.id, [game("2026-10-15T00:00:00.000Z")]);
    expect(lastPlayed()).toBe("2026-10-15T00:00:00.000Z");
  });
});

