// __tests__/lib/hunting/hunting-meta.services.test.ts

import { describe, it, expect } from "vitest";
import {
  getDifficultyMeta,
  estimateGameDifficulty,
  estimateCompletionHours,
  estimateMinPlaythroughs,
  computeGameHuntingMeta,
} from "@/lib/hunting/hunting-meta.services";
import type { Achievement } from "@/lib/types";

describe("hunting-meta.services", () => {
  it("maps difficulty ratings to French labels and CSS classes", () => {
    expect(getDifficultyMeta(2).label).toBe("Très facile");
    expect(getDifficultyMeta(4).label).toBe("Facile");
    expect(getDifficultyMeta(6).label).toBe("Moyen");
    expect(getDifficultyMeta(8).label).toBe("Difficile");
    expect(getDifficultyMeta(10).label).toBe("Extrême");
  });

  it("estimates game difficulty based on rarity and missables", () => {
    expect(estimateGameDifficulty([])).toBe(1);

    const easy: Achievement[] = [
      { id: "1", name: "A", desc: "", icon: "", percent: 45, hidden: false, missable: false },
    ];
    expect(estimateGameDifficulty(easy)).toBe(2);

    const medium: Achievement[] = [
      { id: "1", name: "A", desc: "", icon: "", percent: 12, hidden: false, missable: false },
      { id: "2", name: "B", desc: "", icon: "", percent: 6, hidden: false, missable: false },
      { id: "3", name: "C", desc: "", icon: "", percent: 3, hidden: false, missable: false },
    ];
    expect(estimateGameDifficulty(medium)).toBe(6);

    const hardcore: Achievement[] = Array.from({ length: 6 }, (_, i) => ({
      id: `${i}`,
      name: `Hard ${i}`,
      desc: "Missable",
      icon: "",
      percent: 0.4,
      hidden: false,
      missable: true,
    }));
    expect(estimateGameDifficulty(hardcore)).toBe(10);
  });

  it("estimates completion hours and minimum playthroughs", () => {
    expect(estimateCompletionHours([], 1)).toBe(5);
    const list: Achievement[] = Array.from({ length: 30 }, (_, i) => ({
      id: `${i}`,
      name: `Ach ${i}`,
      desc: i === 0 ? "Terminer en New Game+" : "Normal",
      icon: "",
      percent: 20,
      hidden: false,
      missable: false,
    }));
    expect(estimateCompletionHours(list, 5)).toBeGreaterThan(15);
    expect(estimateMinPlaythroughs(list)).toBe(2);
    expect(estimateMinPlaythroughs([list[1]])).toBe(1);
  });

  it("computes full GameHuntingMeta and respects custom user overrides", () => {
    const achievements: Achievement[] = [
      { id: "1", name: "Story", desc: "Finish story", icon: "", percent: 30, hidden: false, missable: true },
    ];
    const autoMeta = computeGameHuntingMeta(achievements);
    expect(autoMeta.isCustomOverride).toBe(false);
    expect(autoMeta.missableCount).toBe(1);

    const overridden = computeGameHuntingMeta(achievements, {
      difficultyRating: 9,
      estimatedHours: 80,
      minPlaythroughs: 3,
      warningType: "bugged",
    });
    expect(overridden.isCustomOverride).toBe(true);
    expect(overridden.difficultyRating).toBe(9);
    expect(overridden.difficultyLabel).toBe("Extrême");
    expect(overridden.estimatedHours).toBe(80);
    expect(overridden.minPlaythroughs).toBe(3);
    expect(overridden.warningType).toBe("bugged");
    expect(overridden.warningMessage).toContain("buggés");
  });
});
