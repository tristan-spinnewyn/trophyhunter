// __tests__/db/game-status.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserOwnedGames,
  getUserOwnedGames,
  setUserGameStatus,
  getUserGameStatus,
} from "@/lib/db";
import { InvalidGameStatusError } from "@/lib/game-status/game-status.types";
import type { OwnedGame } from "@/lib/types";

describe("Database Game Status Across Platforms", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("defaults new games to backlog across all platforms and preserves status on re-sync", () => {
    const user = createUser("StatusUser", "password123");
    const games: OwnedGame[] = [
      { appId: 1, name: "Steam Game", headerImg: "", platform: "steam", totalAchievements: 10, unlockedCount: 2, addedAt: "2026-01-01" },
      { appId: 2, name: "Xbox Game", headerImg: "", platform: "xbox", totalAchievements: 20, unlockedCount: 5, addedAt: "2026-01-02" },
      { appId: 3, name: "Epic Game", headerImg: "", platform: "epic", totalAchievements: 15, unlockedCount: 0, addedAt: "2026-01-03" },
      { appId: 4, name: "GOG Game", headerImg: "", platform: "gog", totalAchievements: 30, unlockedCount: 10, addedAt: "2026-01-04" },
    ];

    saveUserOwnedGames(user.id, games);
    const saved = getUserOwnedGames(user.id);
    expect(saved.every((g) => g.status === "backlog")).toBe(true);

    setUserGameStatus(user.id, 1, "steam", "in-progress");
    setUserGameStatus(user.id, 2, "xbox", "completed");
    setUserGameStatus(user.id, 3, "epic", "completed");

    expect(getUserGameStatus(user.id, 1, "steam")).toBe("in-progress");
    expect(getUserGameStatus(user.id, 2, "xbox")).toBe("completed");
    expect(getUserGameStatus(user.id, 3, "epic")).toBe("completed");
    expect(getUserGameStatus(user.id, 4, "gog")).toBe("backlog");

    saveUserOwnedGames(user.id, [
      { appId: 1, name: "Steam Game", headerImg: "", platform: "steam", totalAchievements: 10, unlockedCount: 6, addedAt: "2026-01-01" },
    ]);
    expect(getUserGameStatus(user.id, 1, "steam")).toBe("in-progress");
  });

  it("inserts missing game when setting status directly and rejects invalid status", () => {
    const user = createUser("StatusEdge", "password123");
    expect(getUserGameStatus(user.id, 999, "gog")).toBe("backlog");

    setUserGameStatus(user.id, 999, "gog", "completed", "Cyberpunk GOG");
    expect(getUserGameStatus(user.id, 999, "gog")).toBe("completed");

    expect(() =>
      setUserGameStatus(user.id, 999, "gog", "invalid" as unknown as "backlog")
    ).toThrow(InvalidGameStatusError);
  });
});
