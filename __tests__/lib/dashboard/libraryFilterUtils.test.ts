// __tests__/lib/dashboard/libraryFilterUtils.test.ts
import { describe, it, expect } from "vitest";
import { filterGames } from "@/components/dashboard/hooks/libraryFilterUtils";
import type { OwnedGame } from "@/lib/types";

const SAMPLE_GAMES: OwnedGame[] = [
  { appId: 1, name: "Backlog Steam", headerImg: "", platform: "steam", totalAchievements: 20, unlockedCount: 0, addedAt: "2026-01-01" },
  { appId: 2, name: "In Progress Xbox", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 10, addedAt: "2026-01-02", status: "in-progress" },
  { appId: 3, name: "Finished Epic No Plat", headerImg: "", platform: "epic", totalAchievements: 40, unlockedCount: 12, addedAt: "2026-01-03", status: "completed" },
  { appId: 4, name: "Platinum GOG", headerImg: "", platform: "gog", totalAchievements: 30, unlockedCount: 30, addedAt: "2026-01-04", status: "completed" },
];

describe("filterGames with GameStatus", () => {
  const baseParams = {
    games: SAMPLE_GAMES,
    activePlatformTab: "all" as const,
    libPlatformFilter: "all" as const,
    libStatusFilter: "all" as const,
    libAchievementFilter: "all" as const,
    libSearch: "",
    wishlistIds: [2],
    collections: [{ id: "c1", name: "RPG", description: "", color: "#000", gameIds: [3] }],
    selectedCollId: "c1",
  };

  it("filters by backlog, in-progress, completed and platinum across platforms", () => {
    const backlog = filterGames({ ...baseParams, libStatusFilter: "backlog" });
    expect(backlog.map((g) => g.appId)).toEqual([1]);

    const inProgress = filterGames({ ...baseParams, libStatusFilter: "in-progress" });
    expect(inProgress.map((g) => g.appId)).toEqual([2]);

    const completed = filterGames({ ...baseParams, libStatusFilter: "completed" });
    expect(completed.map((g) => g.appId)).toEqual([3, 4]);

    const platinum = filterGames({ ...baseParams, libStatusFilter: "platinum" });
    expect(platinum.map((g) => g.appId)).toEqual([4]);
  });

  it("combines platform tab and status filters accurately", () => {
    const epicCompleted = filterGames({
      ...baseParams,
      activePlatformTab: "epic",
      libStatusFilter: "completed",
    });
    expect(epicCompleted.map((g) => g.appId)).toEqual([3]);

    const xboxCompleted = filterGames({
      ...baseParams,
      activePlatformTab: "xbox",
      libStatusFilter: "completed",
    });
    expect(xboxCompleted).toHaveLength(0);
  });
});
