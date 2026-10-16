// __tests__/db/duplicates.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserOwnedGames,
  getUserDuplicateGames,
} from "@/lib/db";
import type { OwnedGame } from "@/lib/types";

describe("Database Cross-Platform Duplicates", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("detects cross-platform duplicate games", () => {
    const user = createUser("DupUser", "password123");
    const games: OwnedGame[] = [
      {
        appId: 292030,
        name: "The Witcher 3: Wild Hunt - Game of the Year Edition",
        headerImg: "https://example.com/w3.jpg",
        platform: "steam",
        totalAchievements: 78,
        unlockedCount: 50,
        addedAt: new Date().toISOString(),
      },
      {
        appId: 10001,
        name: "The Witcher 3: Wild Hunt (GOTY Edition)",
        headerImg: "https://example.com/w3-gog.jpg",
        platform: "gog",
        totalAchievements: 78,
        unlockedCount: 10,
        addedAt: new Date().toISOString(),
      },
      {
        appId: 70,
        name: "Half-Life",
        headerImg: "https://example.com/hl.jpg",
        platform: "steam",
        totalAchievements: 0,
        unlockedCount: 0,
        addedAt: new Date().toISOString(),
      },
    ];
    saveUserOwnedGames(user.id, games);

    const duplicates = getUserDuplicateGames(user.id);
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].games.length).toBe(2);
    expect(duplicates[0].games.some((g) => g.platform === "steam")).toBe(true);
    expect(duplicates[0].games.some((g) => g.platform === "gog")).toBe(true);
  });
});
