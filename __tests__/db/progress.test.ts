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
} from "@/lib/db";

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
});
