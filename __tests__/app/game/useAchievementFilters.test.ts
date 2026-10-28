// @vitest-environment jsdom
// __tests__/app/game/useAchievementFilters.test.ts
import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAchievementFilters } from "@/app/game/[id]/hooks/useAchievementFilters";
import type { Achievement, UserGameProgress } from "@/lib/types";

const ach = (id: string, name: string, percent: number, extra: Partial<Achievement> = {}): Achievement => ({
  id, name, desc: `${name} description`, icon: "", percent, hidden: false, missable: false, ...extra,
});
const achievements = [
  ach("a", "Zelda", 50),
  ach("b", "Alpha", 5, { missable: true }),
  ach("c", "Mystery", 20, { hidden: true }),
];
const progress: UserGameProgress = { unlockedIds: ["a"], notes: { c: "boss secret" }, pinnedIds: ["b"] };

const ids = (list: Achievement[]) => list.map((a) => a.id);

describe("useAchievementFilters", () => {
  it("counts achievements by state", () => {
    const { result } = renderHook(() => useAchievementFilters(achievements, progress));
    expect(result.current.counts).toEqual({ all: 3, unlocked: 1, locked: 2, missable: 1, hidden: 1, pinned: 1 });
    expect(ids(result.current.displayedAchievements)).toEqual(["a", "b", "c"]);
  });

  it.each([
    ["unlocked", ["a"]],
    ["locked", ["b", "c"]],
    ["missable", ["b"]],
    ["hidden", ["c"]],
    ["pinned", ["b"]],
  ] as const)("filters %s achievements", (filter, expected) => {
    const { result } = renderHook(() => useAchievementFilters(achievements, progress));
    act(() => result.current.setFilter(filter));
    expect(ids(result.current.displayedAchievements)).toEqual(expected);
  });

  it("searches names, descriptions and personal notes", () => {
    const { result } = renderHook(() => useAchievementFilters(achievements, progress));
    act(() => result.current.setSearch("BOSS"));
    expect(ids(result.current.displayedAchievements)).toEqual(["c"]);
    act(() => result.current.setSearch("alpha desc"));
    expect(ids(result.current.displayedAchievements)).toEqual(["b"]);
  });

  it.each([
    ["rarity-asc", ["b", "c", "a"]],
    ["rarity-desc", ["a", "c", "b"]],
    ["name-asc", ["b", "c", "a"]],
  ] as const)("sorts by %s", (sort, expected) => {
    const { result } = renderHook(() => useAchievementFilters(achievements, progress));
    act(() => result.current.setSort(sort));
    expect(ids(result.current.displayedAchievements)).toEqual(expected);
  });

  it("handles a game whose achievements are not loaded yet", () => {
    const { result } = renderHook(() => useAchievementFilters(undefined, progress));
    expect(result.current.displayedAchievements).toEqual([]);
    expect(result.current.counts.all).toBe(0);
    act(() => result.current.setRevealSecrets(true));
    expect(result.current.revealSecrets).toBe(true);
  });
});
