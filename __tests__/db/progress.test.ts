// __tests__/db/progress.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserGameProgress,
  getUserGameProgress,
  getAllUserGameProgress,
} from "@/lib/db";

describe("Database Game Progress", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("saves and retrieves game progress", () => {
    const user = createUser("ProgressUser", "password123");
    saveUserGameProgress(user.id, 400, "steam", {
      unlockedIds: ["ACH_1", "ACH_2"],
      notes: { ACH_1: "Found in secret room" },
    });

    const prog = getUserGameProgress(user.id, 400, "steam");
    expect(prog).not.toBeNull();
    expect(prog?.unlockedIds).toEqual(["ACH_1", "ACH_2"]);
    expect(prog?.notes.ACH_1).toBe("Found in secret room");

    const allProg = getAllUserGameProgress(user.id);
    expect(allProg["steam_400"]).toBeDefined();
  });
});
