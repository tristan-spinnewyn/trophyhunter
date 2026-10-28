import { describe, it, expect } from "vitest";
import {
  HIDDEN_ACHIEVEMENT_TEXT,
  getAchievementDescription,
} from "@/components/achievement/achievementDescription";

const secret = { hidden: true, desc: "Defeat the final boss" };
const visible = { hidden: false, desc: "Open the first door" };

describe("getAchievementDescription", () => {
  it("returns the description of a visible achievement", () => {
    expect(getAchievementDescription(visible, { revealSecret: false, isUnlocked: false })).toEqual({
      text: "Open the first door",
      isMasked: false,
    });
  });

  it("masks a locked secret achievement until secrets are revealed", () => {
    expect(getAchievementDescription(secret, { revealSecret: false, isUnlocked: false })).toEqual({
      text: HIDDEN_ACHIEVEMENT_TEXT,
      isMasked: true,
    });
  });

  it("shows a secret achievement once secrets are revealed", () => {
    expect(getAchievementDescription(secret, { revealSecret: true, isUnlocked: false }).isMasked).toBe(false);
  });

  it("shows a secret achievement the player already unlocked", () => {
    expect(getAchievementDescription(secret, { revealSecret: false, isUnlocked: true }).text).toBe(
      "Defeat the final boss",
    );
  });

  it("keeps the masked text short enough for a single line on mobile", () => {
    expect(HIDDEN_ACHIEVEMENT_TEXT.length).toBeLessThanOrEqual(40);
  });
});
