// __tests__/lib/hunting/pinned-targets.services.test.ts

import { describe, it, expect } from "vitest";
import {
  MAX_PINNED_TARGETS,
  normalizePinnedIds,
  isAchievementPinned,
  canPinMoreTargets,
  togglePinnedAchievement,
  clearUnlockedPinnedAchievements,
  getPinnedAchievementsList,
} from "@/lib/hunting/pinned-targets.services";
import { MaxPinnedTargetsExceededError } from "@/lib/hunting/hunting.types";
import type { Achievement } from "@/lib/types";

const mockAchievements: Achievement[] = [
  { id: "A1", name: "First", desc: "Desc 1", icon: "", percent: 50, hidden: false, missable: false },
  { id: "A2", name: "Second", desc: "Desc 2", icon: "", percent: 20, hidden: false, missable: true },
  { id: "A3", name: "Third", desc: "Desc 3", icon: "", percent: 5, hidden: true, missable: false },
];

describe("pinned-targets.services", () => {
  it("normalizes pinned IDs removing duplicates, blanks, and capping to MAX_PINNED_TARGETS", () => {
    expect(normalizePinnedIds(null)).toEqual([]);
    expect(normalizePinnedIds("invalid")).toEqual([]);
    expect(normalizePinnedIds(["A1", " A1 ", "", 123, "A2", "A3", "A4", "A5", "A6"])).toEqual([
      "A1",
      "A2",
      "A3",
      "A4",
      "A5",
    ]);
  });

  it("checks whether an achievement is pinned and if more targets can be pinned", () => {
    expect(isAchievementPinned(undefined, "A1")).toBe(false);
    expect(isAchievementPinned(["A1"], "")).toBe(false);
    expect(isAchievementPinned(["A1", "A2"], "A2")).toBe(true);
    expect(canPinMoreTargets(undefined)).toBe(true);
    expect(canPinMoreTargets(["1", "2", "3", "4", "5"])).toBe(false);
  });

  it("toggles pinned achievement and throws MaxPinnedTargetsExceededError when full", () => {
    const step1 = togglePinnedAchievement(undefined, "A1");
    expect(step1).toEqual(["A1"]);

    const step2 = togglePinnedAchievement(step1, "A2");
    expect(step2).toEqual(["A1", "A2"]);

    const unpinned = togglePinnedAchievement(step2, "A1");
    expect(unpinned).toEqual(["A2"]);

    expect(togglePinnedAchievement(["A1"], "   ")).toEqual(["A1"]);

    const fullList = Array.from({ length: MAX_PINNED_TARGETS }, (_, i) => `ID_${i}`);
    expect(() => togglePinnedAchievement(fullList, "NEW_ID")).toThrow(
      MaxPinnedTargetsExceededError
    );
  });

  it("clears unlocked achievements from pinned list", () => {
    expect(clearUnlockedPinnedAchievements(undefined, ["A1"])).toEqual([]);
    expect(clearUnlockedPinnedAchievements(["A1", "A2", "A3"], ["A2"])).toEqual([
      "A1",
      "A3",
    ]);
  });

  it("maps pinned IDs to ordered Achievement objects", () => {
    expect(getPinnedAchievementsList([], ["A1"])).toEqual([]);
    expect(getPinnedAchievementsList(mockAchievements, undefined)).toEqual([]);

    const list = getPinnedAchievementsList(mockAchievements, ["A3", "UNKNOWN", "A1"]);
    expect(list.map((a) => a.id)).toEqual(["A3", "A1"]);
  });
});
