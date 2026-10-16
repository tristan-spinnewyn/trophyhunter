// __tests__/storage/progress.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  getGameProgress,
  saveGameProgress,
  toggleAchievementUnlocked,
  setAchievementNote,
  resetGameProgress,
  upsertOwnedGames,
  getOwnedGames,
} from "@/lib/storage";

describe("Storage Game Progress", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("manages progress and updates owned game unlocked count", () => {
    expect(getGameProgress(12345).unlockedIds).toEqual([]);

    upsertOwnedGames([
      {
        appId: 500,
        name: "Tracked Game",
        headerImg: "img.jpg",
        platform: "steam",
        totalAchievements: 10,
        unlockedCount: 0,
        addedAt: "2026-01-01",
      },
    ]);

    saveGameProgress(500, {
      unlockedIds: ["ach_1", "ach_2"],
      notes: {},
      lastPlayed: "2026-10-16",
    });

    expect(getGameProgress(500).unlockedIds).toEqual(["ach_1", "ach_2"]);
    const updated = getOwnedGames().find((g) => g.appId === 500);
    expect(updated?.unlockedCount).toBe(2);
  });

  it("toggles achievements, sets notes and resets progress", () => {
    const afterUnlock = toggleAchievementUnlocked(300, "ach_test");
    expect(afterUnlock.unlockedIds).toContain("ach_test");

    const afterLock = toggleAchievementUnlocked(300, "ach_test");
    expect(afterLock.unlockedIds).not.toContain("ach_test");

    setAchievementNote(400, "ach_note_1", "Secret room chest");
    expect(getGameProgress(400).notes["ach_note_1"]).toBe("Secret room chest");

    saveGameProgress(777, { unlockedIds: ["a", "b"], notes: { a: "note" } });
    resetGameProgress(777);
    expect(getGameProgress(777).unlockedIds).toEqual([]);
  });
});
