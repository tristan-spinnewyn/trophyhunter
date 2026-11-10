// __tests__/lib/library/status-suggestion.test.ts
import { describe, it, expect } from "vitest";
import { suggestGameStatus } from "@/lib/library/status-suggestion";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const NOW = new Date("2026-11-10T12:00:00.000Z");

describe("suggestGameStatus", () => {
  it("suggests finished for a game with every achievement unlocked", () => {
    const game = makeOwnedGame({ totalAchievements: 10, unlockedCount: 10, lastPlayed: "2026-11-09T12:00:00.000Z" });

    expect(suggestGameStatus(game, NOW)).toEqual({ status: "completed", reason: "100 % des succès" });
  });

  it("suggests in progress for a game played in the last 30 days", () => {
    const game = makeOwnedGame({ playtimeHours: 12, lastPlayed: "2026-11-07T12:00:00.000Z" });

    expect(suggestGameStatus(game, NOW)).toEqual({ status: "in-progress", reason: "Joué il y a 3 jours" });
  });

  it("suggests the backlog for a game that was never launched", () => {
    const game = makeOwnedGame({ unlockedCount: 0, playtimeHours: 0, lastPlayed: undefined });

    expect(suggestGameStatus(game, NOW)).toEqual({ status: "backlog", reason: "Jamais lancé" });
  });

  it("does not guess for a game played long ago: paused and abandoned are the owner's call", () => {
    const old = makeOwnedGame({ playtimeHours: 8, lastPlayed: "2025-03-01T12:00:00.000Z" });
    const noDate = makeOwnedGame({ playtimeHours: 8, lastPlayed: undefined });
    const onlyAchievements = makeOwnedGame({ unlockedCount: 2, playtimeHours: 0, lastPlayed: undefined });

    expect(suggestGameStatus(old, NOW)).toBeNull();
    expect(suggestGameStatus(noDate, NOW)).toBeNull();
    expect(suggestGameStatus(onlyAchievements, NOW)).toBeNull();
  });

  it("treats exactly 30 days as recent and ignores an unreadable date", () => {
    const edge = makeOwnedGame({ playtimeHours: 1, lastPlayed: "2026-10-11T12:00:00.000Z" });
    const broken = makeOwnedGame({ playtimeHours: 1, lastPlayed: "not-a-date" });

    expect(suggestGameStatus(edge, NOW)?.status).toBe("in-progress");
    expect(suggestGameStatus(broken, NOW)).toBeNull();
  });
});
