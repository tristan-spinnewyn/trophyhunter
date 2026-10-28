// __tests__/lib/library/library-sort.test.ts
import { describe, it, expect } from "vitest";
import { DEFAULT_SORT_ORDER, sortGames } from "@/lib/library/library-sort";
import type { OwnedGame } from "@/lib/types";

const game = (appId: number, name: string, total: number, unlocked: number, playtimeHours?: number): OwnedGame => ({
  appId, name, headerImg: "", platform: "steam", totalAchievements: total, unlockedCount: unlocked,
  addedAt: "2026-01-01", playtimeHours,
});
const games = [game(1, "Celeste", 30, 30, 20), game(2, "Bastion", 50, 10, 5), game(3, "Hades", 50, 40), game(4, "Antichamber", 0, 0, 50)];
const ids = (list: OwnedGame[]) => list.map((g) => g.appId);

describe("sortGames", () => {
  it.each([
    ["achievements-desc", [3, 2, 1, 4]],
    ["achievements-asc", [4, 1, 2, 3]],
    ["name-asc", [4, 2, 1, 3]],
    ["playtime-desc", [4, 1, 2, 3]],
    ["completion-desc", [1, 3, 2, 4]],
  ] as const)("orders by %s", (order, expected) => {
    expect(ids(sortGames(games, order))).toEqual(expected);
  });

  it("does not mutate the input list", () => {
    const input = [...games];
    sortGames(input, "name-asc");
    expect(ids(input)).toEqual([1, 2, 3, 4]);
  });

  describe("recent activity", () => {
    const at = (appId: number, name: string, addedAt: string, lastPlayed?: string): OwnedGame => ({
      ...game(appId, name, 10, 0), addedAt, lastPlayed,
    });

    it("is the default order of the collection", () => {
      expect(DEFAULT_SORT_ORDER).toBe("recent-activity");
    });

    it("puts the most recently played games first", () => {
      const list = [
        at(1, "Old", "2026-01-01", "2026-02-01"),
        at(2, "Fresh", "2026-01-01", "2026-10-20"),
        at(3, "Middle", "2026-01-01", "2026-06-15"),
      ];

      expect(ids(sortGames(list, "recent-activity"))).toEqual([2, 3, 1]);
    });

    it("falls back to the date the game was added when it was never played", () => {
      const list = [
        at(1, "Added long ago", "2025-01-01"),
        at(2, "Played", "2025-01-01", "2026-03-01"),
        at(3, "Just added", "2026-09-01"),
      ];

      expect(ids(sortGames(list, "recent-activity"))).toEqual([3, 2, 1]);
    });

    it("breaks ties by name", () => {
      const list = [at(1, "Zelda", "2026-01-01"), at(2, "Astro", "2026-01-01")];

      expect(ids(sortGames(list, "recent-activity"))).toEqual([2, 1]);
    });
  });
});
