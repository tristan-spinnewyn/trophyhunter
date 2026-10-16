// __tests__/epic/achievements_parser.test.ts
import { describe, it, expect } from "vitest";
import { epicAchievementId, unwrapPlayerAchievement } from "@/lib/epic/game-achievements";

describe("Epic Achievements Parser", () => {
  it("generates formatted slugs from achievement names", () => {
    expect(epicAchievementId("First Blood")).toBe("epic_first_blood");
    expect(epicAchievementId("Master of Shadows")).toBe("epic_master_of_shadows");
    expect(epicAchievementId("Special-Chars! #123")).toBe("epic_special_chars___123");
  });

  it("unwraps player achievement objects safely", () => {
    expect(
      unwrapPlayerAchievement({
        playerAchievement: { achievementName: "ACH_1", unlocked: true },
      })
    ).toEqual({ achievementName: "ACH_1", unlocked: true });

    expect(
      unwrapPlayerAchievement({ achievementName: "ACH_2", unlocked: false })
    ).toEqual({ achievementName: "ACH_2", unlocked: false });
  });
});
