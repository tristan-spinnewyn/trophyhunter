// __tests__/epic/achievements_parser.test.ts
import { describe, it, expect } from "vitest";
import { epicAchievementId, unwrapPlayerAchievement } from "@/lib/epic/game-achievements";
import { parseEpicAchievementRecords, mergeEpicSummaries } from "@/lib/epic/achievements-parser";

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

  it("parses achievement records without mistaking unlocked-only list for totalAchievements", () => {
    const { achBySandbox, rawTotalAchievements, rawCompletedGames } = parseEpicAchievementRecords([
      {
        sandboxId: "sb_partial",
        totalUnlocked: 2,
        playerAchievements: [
          { playerAchievement: { achievementName: "A1", unlocked: true } },
          { playerAchievement: { achievementName: "A2", unlocked: true } },
        ],
      },
      {
        sandboxId: "sb_with_sets",
        totalUnlocked: 5,
        achievementSets: [{ totalAchievements: 5, totalUnlocked: 5 }],
        playerAchievements: [{ playerAchievement: { achievementName: "B1", unlocked: true } }],
      },
    ]);

    expect(rawTotalAchievements).toBe(7);
    expect(rawCompletedGames).toBe(1);
    expect(achBySandbox.get("sb_partial")?.totalAchievements).toBe(0);
    expect(achBySandbox.get("sb_with_sets")?.totalAchievements).toBe(5);
  });

  it("merges productAchievements total from summaries into achBySandbox", () => {
    const parsed = parseEpicAchievementRecords([
      { sandboxId: "sb_1", totalUnlocked: 3, playerAchievements: [{ achievementName: "A1", unlocked: true }] },
    ]);
    mergeEpicSummaries(parsed.achBySandbox, [
      {
        sandboxId: "sb_1",
        totalUnlocked: 3,
        product: { name: "Control" },
        productAchievements: { totalAchievements: 42 },
      },
    ]);

    expect(parsed.achBySandbox.get("sb_1")?.totalAchievements).toBe(42);
    expect(parsed.achBySandbox.get("sb_1")?.gameTitle).toBe("Control");
  });
});

