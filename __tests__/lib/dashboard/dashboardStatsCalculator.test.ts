// __tests__/lib/dashboard/dashboardStatsCalculator.test.ts

import { describe, it, expect } from "vitest";
import type { OwnedGame, UserAccountProfile } from "@/lib/types";
import {
  calculateDuplicateGroups,
  calculatePlatformCounts,
  calculateEpicCounts,
  calculateGlobalStats,
} from "@/components/dashboard/hooks/dashboardStatsCalculator";

const baseGame = (overrides: Partial<OwnedGame>): OwnedGame => ({
  appId: 1,
  name: "Test Game",
  headerImg: "https://example.com/img.jpg",
  platform: "steam",
  totalAchievements: 10,
  unlockedCount: 0,
  addedAt: "2026-01-01T00:00:00.000Z",
  source: "manual",
  status: "backlog",
  ...overrides,
});

const emptyProfile: UserAccountProfile = { displayName: "Player", accounts: {} };

describe("dashboardStatsCalculator", () => {
  it("returns 0% finished games when ownedGames is empty", () => {
    const stats = calculateGlobalStats(emptyProfile, []);
    expect(stats.finishedGamesCount).toBe(0);
    expect(stats.finishedGamesPercent).toBe(0);
    expect(stats.avgCompletion).toBe(0);
  });

  it("calculates finishedGamesCount and finishedGamesPercent from status completed and platinum games", () => {
    const games: OwnedGame[] = [
      baseGame({ appId: 1, totalAchievements: 0, unlockedCount: 0, status: "completed" }),
      baseGame({ appId: 2, totalAchievements: 10, unlockedCount: 10, status: "in-progress" }),
      baseGame({ appId: 3, totalAchievements: 10, unlockedCount: 5, status: "in-progress" }),
      baseGame({ appId: 4, totalAchievements: 20, unlockedCount: 0, status: "backlog" }),
    ];

    const stats = calculateGlobalStats(emptyProfile, games);
    expect(stats.trackedGamesCount).toBe(4);
    expect(stats.finishedGamesCount).toBe(2);
    expect(stats.finishedGamesPercent).toBe(50);
    expect(stats.totalCompletedGames).toBe(1);
    expect(stats.avgCompletion).toBe(50);
  });

  it("merges connected platform account stats with local games", () => {
    const profile: UserAccountProfile = {
      displayName: "Player 1",
      accounts: {
        steam: {
          platform: "steam",
          username: "player1",
          displayName: "Player 1",
          connectedAt: "2026-01-01T00:00:00.000Z",
          stats: { gamesOwned: 10, totalAchievements: 100, completedGames: 3, hoursPlayed: 50 },
        },
      },
    };
    const games = [baseGame({ appId: 1, status: "completed", playtimeHours: 12 })];
    const stats = calculateGlobalStats(profile, games);
    expect(stats.connectedCount).toBe(1);
    expect(stats.totalGamesOwned).toBe(10);
    expect(stats.finishedGamesPercent).toBe(100);
  });

  it("calculates duplicate groups, platform counts, and epic counts", () => {
    const games: OwnedGame[] = [
      baseGame({ appId: 1, name: "Hades", platform: "steam" }),
      baseGame({ appId: 2, name: "Hades", platform: "epic", totalAchievements: 0 }),
      baseGame({ appId: 3, name: "Alan Wake 2", platform: "epic", totalAchievements: 20 }),
    ];
    expect(calculateDuplicateGroups(games)).toHaveLength(1);
    expect(calculatePlatformCounts(games)).toEqual({
      all: 3,
      steam: 1,
      epic: 2,
      xbox: 0,
      gog: 0,
    });
    expect(calculateEpicCounts(games)).toEqual({ total: 2, withAch: 1, noAch: 1 });
  });
});

describe("calculateDuplicateGroups edition matching", () => {
  it("groups the same game across platforms when one copy is an Ultimate Edition, like server-side duplicates", () => {
    const groups = calculateDuplicateGroups([
      baseGame({ appId: 1, name: "Control", platform: "steam" }),
      baseGame({ appId: 2, name: "Control Ultimate Edition", platform: "epic" }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].games.map((g) => g.platform)).toEqual(["steam", "epic"]);
  });
});
