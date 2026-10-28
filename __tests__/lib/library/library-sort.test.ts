// __tests__/lib/library/library-sort.test.ts
import { describe, it, expect } from "vitest";
import { sortGames } from "@/lib/library/library-sort";
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
    ["default", [1, 3, 2, 4]],
  ] as const)("orders by %s", (order, expected) => {
    expect(ids(sortGames(games, order))).toEqual(expected);
  });

  it("does not mutate the input list", () => {
    const input = [...games];
    sortGames(input, "name-asc");
    expect(ids(input)).toEqual([1, 2, 3, 4]);
  });
});
