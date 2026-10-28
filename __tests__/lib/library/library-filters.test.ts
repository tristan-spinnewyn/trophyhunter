// __tests__/lib/library/library-filters.test.ts
import { describe, it, expect } from "vitest";
import { filterGames, isFeatureTab, parseLibraryTab } from "@/lib/library/library-filters";
import type { OwnedGame } from "@/lib/types";

const SAMPLE_GAMES: OwnedGame[] = [
  { appId: 1, name: "Backlog Steam", headerImg: "", platform: "steam", totalAchievements: 20, unlockedCount: 0, addedAt: "2026-01-01" },
  { appId: 2, name: "In Progress Xbox", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 10, addedAt: "2026-01-02", status: "in-progress" },
  { appId: 3, name: "Finished Epic No Plat", headerImg: "", platform: "epic", totalAchievements: 40, unlockedCount: 12, addedAt: "2026-01-03", status: "completed" },
  { appId: 4, name: "Platinum GOG", headerImg: "", platform: "gog", totalAchievements: 30, unlockedCount: 30, addedAt: "2026-01-04", status: "completed" },
];

describe("filterGames platform and feature tabs", () => {
  const baseParams = {
    games: SAMPLE_GAMES,
    activePlatformTab: "all" as const,
    libPlatformFilter: "all" as const,
    libAchievementFilter: "all" as const,
    libSearch: "",
    wishlistIds: [2],
    collections: [{ id: "c1", name: "RPG", description: "", color: "#000", gameIds: [3] }],
    selectedCollId: "c1",
  };

  it("keeps every game, whatever its status, on the all and Game Pass tabs", () => {
    expect(filterGames(baseParams)).toHaveLength(4);
    expect(filterGames({ ...baseParams, activePlatformTab: "gamepass" })).toHaveLength(4);
  });
});

describe("filterGames tabs, achievements and search", () => {
  const base = {
    games: SAMPLE_GAMES,
    activePlatformTab: "all" as const,
    libPlatformFilter: "all" as const,
    libAchievementFilter: "all" as const,
    libSearch: "",
    wishlistIds: [2],
    collections: [{ id: "c1", name: "RPG", gameIds: [3] }],
    selectedCollId: null as string | null,
  };
  const ids = (list: OwnedGame[]) => list.map((g) => g.appId);

  it("shows only wishlisted games on the wishlist tab", () => {
    expect(ids(filterGames({ ...base, activePlatformTab: "wishlist" }))).toEqual([2]);
  });

  it("shows the selected collection, or everything when none is selected", () => {
    expect(ids(filterGames({ ...base, activePlatformTab: "collections", selectedCollId: "c1" }))).toEqual([3]);
    expect(ids(filterGames({ ...base, activePlatformTab: "collections", selectedCollId: "missing" }))).toEqual([]);
    expect(ids(filterGames({ ...base, activePlatformTab: "collections" }))).toEqual([1, 2, 3, 4]);
  });

  it("uses the platform tab, or the platform filter on feature tabs", () => {
    expect(ids(filterGames({ ...base, activePlatformTab: "xbox" }))).toEqual([2]);
    expect(ids(filterGames({ ...base, activePlatformTab: "all", libPlatformFilter: "gog" }))).toEqual([4]);
    expect(ids(filterGames({ ...base, activePlatformTab: "duplicates", libPlatformFilter: "gog" }))).toEqual([1, 2, 3, 4]);
  });

  it("filters by achievement support", () => {
    const noAch: OwnedGame = { ...SAMPLE_GAMES[0], appId: 5, name: "No Achievements", totalAchievements: 0 };
    const games = [...SAMPLE_GAMES, noAch];
    expect(ids(filterGames({ ...base, games, libAchievementFilter: "no-achievements" }))).toEqual([5]);
    expect(ids(filterGames({ ...base, games, libAchievementFilter: "with-achievements" }))).toEqual([1, 2, 3, 4]);
  });

  it("searches by name or app id, case-insensitively", () => {
    expect(ids(filterGames({ ...base, libSearch: "platinum" }))).toEqual([4]);
    expect(ids(filterGames({ ...base, libSearch: "3" }))).toEqual([3]);
  });
});

describe("parseLibraryTab", () => {
  it("accepts every platform and feature tab", () => {
    for (const tab of ["all", "steam", "xbox", "epic", "gog", "gamepass", "duplicates", "wishlist", "collections"]) {
      expect(parseLibraryTab(tab)).toBe(tab);
    }
  });

  it("falls back to all for a missing or unknown value", () => {
    expect(parseLibraryTab(null)).toBe("all");
    expect(parseLibraryTab("")).toBe("all");
    expect(parseLibraryTab("playstation")).toBe("all");
  });
});

describe("isFeatureTab", () => {
  it("is true for views that are not a single platform", () => {
    for (const tab of ["all", "gamepass", "duplicates", "wishlist", "collections"] as const) {
      expect(isFeatureTab(tab)).toBe(true);
    }
  });

  it("is false for a platform tab", () => {
    expect(isFeatureTab("steam")).toBe(false);
    expect(isFeatureTab("gog")).toBe(false);
  });
});
