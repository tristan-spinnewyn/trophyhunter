// __tests__/components/progress/progressTier.test.ts

import { describe, it, expect, vi } from "vitest";
import confetti from "canvas-confetti";
import { fireCompletionConfetti, getProgressTier, getUntrackedUnlockedCount } from "@/components/progress/progressTier";

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

describe("progressTier", () => {
  describe("getProgressTier", () => {
    it("returns Sans succès tier when total is zero or negative", () => {
      const zeroTier = getProgressTier(false, 0, 0);
      expect(zeroTier.name).toBe("Sans succès");
      expect(zeroTier.color).toContain("text-slate-400");

      const negativeTier = getProgressTier(false, 0, -5);
      expect(negativeTier.name).toBe("Sans succès");
    });

    it("returns Platinum tier when isComplete is true and total > 0", () => {
      const tier = getProgressTier(true, 100, 10);
      expect(tier.name).toContain("Platine Obtenu");
      expect(tier.color).toContain("text-sky-400");
    });

    it("returns Gold tier when percent is between 75 and 99", () => {
      const tier = getProgressTier(false, 75, 20);
      expect(tier.name).toContain("Rang Or");
      expect(tier.color).toContain("text-amber-400");
    });

    it("returns Silver tier when percent is between 40 and 74", () => {
      const tier = getProgressTier(false, 40, 20);
      expect(tier.name).toContain("Rang Argent");
      expect(tier.color).toContain("text-slate-300");
    });

    it("returns Bronze tier when percent is below 40 and total > 0", () => {
      const tier = getProgressTier(false, 0, 15);
      expect(tier.name).toContain("Rang Bronze");
      expect(tier.color).toContain("text-amber-600");
    });
  });

  describe("fireCompletionConfetti", () => {
    it("triggers canvas-confetti with expected options", () => {
      fireCompletionConfetti();
      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 120,
          spread: 80,
        })
      );
    });
  });
});

describe("getUntrackedUnlockedCount", () => {
  it("returns the platform count when no achievement is ticked yet", () => {
    expect(getUntrackedUnlockedCount(0, 38)).toBe(38);
  });

  it("returns null once the checklist is used, since it is then the source of truth", () => {
    expect(getUntrackedUnlockedCount(3, 38)).toBeNull();
  });

  it("returns null when the platform reported nothing", () => {
    expect(getUntrackedUnlockedCount(0, 0)).toBeNull();
    expect(getUntrackedUnlockedCount(0, undefined)).toBeNull();
  });
});
