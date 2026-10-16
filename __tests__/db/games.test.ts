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
});
