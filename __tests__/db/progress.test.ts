// __tests__/db/progress.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserGameProgress,
  getUserGameProgress,
  getAllUserGameProgress,
  resetUserGameProgress,
  saveUserOwnedGames,
  getUserOwnedGames,
} from "@/lib/db";
import type { OwnedGame } from "@/lib/types";

/** A game imported from a platform with an achievement count but no per-achievement detail. */
function importGame(userId: string, unlockedCount: number): void {
  const game: OwnedGame = {
    appId: 500, name: "Imported", headerImg: "", platform: "steam",
    totalAchievements: 60, unlockedCount, addedAt: "2026-01-01",
  };
  saveUserOwnedGames(userId, [game]);
}

const countOf = (userId: string) => getUserOwnedGames(userId).find((g) => g.appId === 500)?.unlockedCount;

describe("Database Game Progress", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("saves and retrieves game progress including pinnedIds and huntingMeta", () => {
    const user = createUser("ProgressUser", "password123");
    saveUserGameProgress(user.id, 400, "steam", {
      unlockedIds: ["ACH_1", "ACH_2"],
      notes: { ACH_1: "Found in secret room" },
      pinnedIds: ["ACH_3"],
      huntingMeta: {
        difficultyRating: 8,
        estimatedHours: 55,
        minPlaythroughs: 2,
        warningType: "unobtainable",
        warningMessage: "Serveurs fermés",
      },
    });

    const prog = getUserGameProgress(user.id, 400, "steam");
    expect(prog).not.toBeNull();
    expect(prog?.unlockedIds).toEqual(["ACH_1", "ACH_2"]);
    expect(prog?.notes.ACH_1).toBe("Found in secret room");
    expect(prog?.pinnedIds).toEqual(["ACH_3"]);
    expect(prog?.huntingMeta?.difficultyRating).toBe(8);
    expect(prog?.huntingMeta?.warningType).toBe("unobtainable");

    const allProg = getAllUserGameProgress(user.id);
    expect(allProg["steam_400"]).toBeDefined();
    expect(allProg["steam_400"].pinnedIds).toEqual(["ACH_3"]);

    resetUserGameProgress(user.id, 400, "steam");
    expect(getUserGameProgress(user.id, 400, "steam")).toBeNull();
  });

  describe("keeps the game's unlocked count consistent with its checklist", () => {
    it("does not wipe an imported count when saving a note on a game without checklist", () => {
      const user = createUser("NoteUser", "password123");
      importGame(user.id, 38);

      saveUserGameProgress(user.id, 500, "steam", { unlockedIds: [], notes: { ACH_1: "later" } });

      expect(countOf(user.id)).toBe(38);
    });

    it("does not wipe an imported count when pinning targets", () => {
      const user = createUser("PinUser", "password123");
      importGame(user.id, 38);

      saveUserGameProgress(user.id, 500, "steam", { unlockedIds: [], notes: {}, pinnedIds: ["ACH_9"] });

      expect(countOf(user.id)).toBe(38);
    });

    it("follows the checklist once achievements are ticked", () => {
      const user = createUser("TickUser", "password123");
      importGame(user.id, 0);

      saveUserGameProgress(user.id, 500, "steam", { unlockedIds: ["A", "B", "C"], notes: {} });

      expect(countOf(user.id)).toBe(3);
    });

    it("goes back to zero when the last ticked achievement is unticked", () => {
      const user = createUser("UntickUser", "password123");
      importGame(user.id, 0);
      saveUserGameProgress(user.id, 500, "steam", { unlockedIds: ["A"], notes: {} });

      saveUserGameProgress(user.id, 500, "steam", { unlockedIds: [], notes: {} });

      expect(countOf(user.id)).toBe(0);
    });

    it("resets the count with the checklist", () => {
      const user = createUser("ResetUser", "password123");
      importGame(user.id, 0);
      saveUserGameProgress(user.id, 500, "steam", { unlockedIds: ["A", "B"], notes: {} });

      resetUserGameProgress(user.id, 500, "steam");

      expect(countOf(user.id)).toBe(0);
    });
  });
});
