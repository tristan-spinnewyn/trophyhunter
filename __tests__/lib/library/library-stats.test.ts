// __tests__/lib/library/library-stats.test.ts

import { describe, it, expect } from "vitest";
import type { OwnedGame } from "@/lib/types";
import {
  calculateDuplicateGroups,
  calculatePlatformCounts,
  calculateEpicCounts,
} from "@/lib/library/library-stats";

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

describe("dashboardStatsCalculator", () => {
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
