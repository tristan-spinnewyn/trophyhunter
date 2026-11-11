// __tests__/db/resume-note.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserOwnedGames,
  getUserOwnedGames,
  setUserGameResumeNote,
} from "@/lib/db";
import type { OwnedGame } from "@/lib/types";

const hollowKnight: OwnedGame = {
  appId: 367520,
  name: "Hollow Knight",
  headerImg: "",
  platform: "steam",
  totalAchievements: 0,
  unlockedCount: 0,
  addedAt: "2026-01-01T00:00:00.000Z",
  status: "paused",
};

describe("resume notes", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    userId = createUser("ResumeUser", "password123").id;
    saveUserOwnedGames(userId, [hollowKnight]);
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("stores a note and reads it back with the collection", () => {
    expect(setUserGameResumeNote(userId, 367520, "steam", "Banc de la Cité des Larmes.")).toBe(true);

    expect(getUserOwnedGames(userId)[0].resumeNote).toBe("Banc de la Cité des Larmes.");
  });

  it("clears it", () => {
    setUserGameResumeNote(userId, 367520, "steam", "Banc de la Cité des Larmes.");
    setUserGameResumeNote(userId, 367520, "steam", null);

    expect(getUserOwnedGames(userId)[0].resumeNote).toBeUndefined();
  });

  it("reports a game that is not in the collection", () => {
    expect(setUserGameResumeNote(userId, 1, "steam", "x")).toBe(false);
  });

  it("keeps the note when a sync writes the game again", () => {
    setUserGameResumeNote(userId, 367520, "steam", "Boss Hornet.");

    saveUserOwnedGames(userId, [{ ...hollowKnight, playtimeHours: 30 }]);

    expect(getUserOwnedGames(userId)[0].resumeNote).toBe("Boss Hornet.");
  });

  it("restores the note from a backup", () => {
    saveUserOwnedGames(userId, [{ ...hollowKnight, resumeNote: "Sentier vert." }]);

    expect(getUserOwnedGames(userId)[0].resumeNote).toBe("Sentier vert.");
  });
});
