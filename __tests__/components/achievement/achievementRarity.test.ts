import { describe, it, expect } from "vitest";
import { getRarityBadge } from "@/components/achievement/achievementRarity";

describe("getRarityBadge", () => {
  it("names the rarity tiers", () => {
    expect(getRarityBadge(2).label).toBe("Ultra Rare");
    expect(getRarityBadge(12).label).toBe("Très Rare");
    expect(getRarityBadge(40).label).toBe("Rare");
    expect(getRarityBadge(80).label).toBe("Commun");
  });

  it("uses platinum for achievements, brightest for the rarest", () => {
    expect(getRarityBadge(2).classes).toContain("bg-platinum text-ink");
    expect(getRarityBadge(12).classes).toContain("text-platinum");
    expect(getRarityBadge(40).classes).toContain("text-paper-dim");
    expect(getRarityBadge(80).classes).toContain("text-dust");
    expect([2, 12, 40, 80].some((p) => getRarityBadge(p).classes.includes("lamp"))).toBe(false);
  });
});
