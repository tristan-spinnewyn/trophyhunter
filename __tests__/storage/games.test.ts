// __tests__/storage/games.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  getOwnedGames,
  saveOwnedGames,
  upsertOwnedGames,
  removeOwnedGame,
  isGameOwned,
  removePlatformOwnedGames,
  replacePlatformOwnedGames,
} from "@/lib/storage";
import type { OwnedGame } from "@/lib/types";

describe("Storage Owned Games", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("handles empty library and upserts games sorted by completion", () => {
    expect(getOwnedGames()).toEqual([]);
    expect(isGameOwned(123)).toBe(false);

    const games: readonly OwnedGame[] = [
      {
        appId: 10,
        name: "Game A",
        headerImg: "https://example.com/a.jpg",
        platform: "steam",
        totalAchievements: 10,
        unlockedCount: 2,
        addedAt: "2026-01-01",
      },
      {
        appId: 20,
        name: "Game B",
        headerImg: "https://example.com/b.jpg",
        platform: "steam",
        totalAchievements: 10,
        unlockedCount: 8,
        addedAt: "2026-01-02",
      },
    ];

    const saved = upsertOwnedGames(games);
    expect(saved.length).toBe(2);
    expect(saved[0].appId).toBe(20);
    expect(saved[1].appId).toBe(10);
    expect(isGameOwned(10)).toBe(true);
  });

  it("removes individual game and removes games by platform", () => {
    const games: readonly OwnedGame[] = [
      { appId: 1, name: "Steam Game", headerImg: "", platform: "steam", totalAchievements: 10, unlockedCount: 0, addedAt: "" },
      { appId: 2, name: "Epic Game", headerImg: "", platform: "epic", totalAchievements: 10, unlockedCount: 0, addedAt: "" },
    ];
    upsertOwnedGames(games);

    const afterRemove = removePlatformOwnedGames("epic");
    expect(afterRemove.length).toBe(1);
    expect(afterRemove[0].platform).toBe("steam");

    removeOwnedGame(1, "steam");
    expect(getOwnedGames().length).toBe(0);
  });

  it("replaces platform games and resolves epic codenames on retrieval", () => {
    const initial: readonly OwnedGame[] = [
      { appId: 1, name: "Steam Game", headerImg: "", platform: "steam", totalAchievements: 10, unlockedCount: 0, addedAt: "" },
      { appId: 2, name: "Old Epic Game", headerImg: "", platform: "epic", totalAchievements: 10, unlockedCount: 0, addedAt: "" },
    ];
    upsertOwnedGames(initial);

    const newEpicGames: readonly OwnedGame[] = [
      { appId: 3, name: "New Game", headerImg: "", platform: "epic", totalAchievements: 20, unlockedCount: 5, addedAt: "" },
    ];
    const replaced = replacePlatformOwnedGames("epic", newEpicGames);
    expect(replaced.length).toBe(2);
    expect(replaced.some((g) => g.appId === 1 && g.platform === "steam")).toBe(true);
    expect(replaced.some((g) => g.appId === 3 && g.platform === "epic")).toBe(true);

    const rawGames: readonly OwnedGame[] = [
      { appId: 1001, name: "Angelonia", headerImg: "", platform: "epic", totalAchievements: 10, unlockedCount: 2, addedAt: "" },
      { appId: 1002, name: "Catnip", headerImg: "", platform: "epic", totalAchievements: 25, unlockedCount: 5, addedAt: "" },
    ];
    saveOwnedGames(rawGames);
    const resolved = getOwnedGames();
    expect(resolved[0].name).toBe("Watch Dogs 2");
    expect(resolved[1].name).toBe("Control");
  });
});
