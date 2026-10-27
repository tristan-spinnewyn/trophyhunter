// __tests__/epic/achievements_query.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchEpicProductAchievements,
  fetchEpicPlayerUnlockedNames,
} from "@/lib/epic/game-achievements";
import { fetchEpicPlayerAchievements } from "@/lib/epic/graphql";
import { jsonResponse } from "../helpers/responses";

describe("Epic GraphQL Achievements Queries", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches product achievements definitions from GraphQL", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        data: {
          Achievement: {
            productAchievementsRecordBySandbox: {
              totalAchievements: 1,
              achievements: [{
                achievement: {
                  name: "ACH_START",
                  unlockedDisplayName: "Premier pas",
                  unlockedDescription: "Avoir commencé",
                  unlockedIconLink: "https://epic.com/icon1.png",
                  hidden: false,
                  rarity: { percent: 95.5 },
                },
              }],
            },
          },
        },
      })
    );

    const list = await fetchEpicProductAchievements("sandbox_test", "token_123");
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("epic_ach_start");
    expect(list[0].name).toBe("Premier pas");
    expect(list[0].percent).toBe(95.5);
  });

  it("fetches player unlocked names from GraphQL", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        data: {
          PlayerAchievement: {
            playerAchievementGameRecordsBySandbox: {
              records: [{
                totalUnlocked: 1,
                playerAchievements: [
                  { playerAchievement: { achievementName: "ACH_START", unlocked: true } },
                  { playerAchievement: { achievementName: "ACH_END", unlocked: false } },
                ],
              }],
            },
          },
        },
      })
    );

    const { unlockedNames, totalUnlocked } =
      await fetchEpicPlayerUnlockedNames("acc_1", "sandbox_1", "token_1");
    expect(totalUnlocked).toBe(1);
    expect(unlockedNames.has("ACH_START")).toBe(true);
    expect(unlockedNames.has("ACH_END")).toBe(false);
  });

  it("fetches player achievements list and handles error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        data: {
          PlayerAchievement: {
            playerAchievementGameRecords: {
              records: [{
                sandboxId: "sandbox_test",
                totalUnlocked: 5,
                totalXP: 100,
                playerAchievements: [{ achievementName: "ACH_1", unlocked: true }],
              }],
            },
          },
        },
      })
    );

    const records = await fetchEpicPlayerAchievements("acc_1", "tok_1");
    expect(records).toHaveLength(1);
    expect(records[0].totalUnlocked).toBe(5);

    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network failed"));
    expect(await fetchEpicPlayerAchievements("acc_1", "tok_1")).toEqual([]);
  });
});
