// __tests__/epic/game_achievements.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { initDatabase, setDbForTesting, createUser } from "@/lib/db";
import { storeEpicCredentials } from "@/lib/epic/credentials";
import { getEpicGameAchievements } from "@/lib/epic/game-achievements";
import { getEpicAchievementsForUser } from "@/lib/epic/game-details";
import { jsonResponse } from "../helpers/responses";

describe("Epic Game Achievements Combination", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("combines definitions and player unlocks in getEpicGameAchievements", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            Achievement: {
              productAchievementsRecordBySandbox: {
                totalAchievements: 2,
                achievements: [
                  {
                    achievement: {
                      name: "ACH_1",
                      unlockedDisplayName: "Victoire",
                      unlockedDescription: "Gagner un match",
                      unlockedIconLink: "https://epic.com/win.png",
                      hidden: false,
                      rarity: { percent: 50 },
                    },
                  },
                ],
              },
            },
          },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            PlayerAchievement: {
              playerAchievementGameRecordsBySandbox: {
                records: [
                  {
                    totalUnlocked: 1,
                    playerAchievements: [
                      { playerAchievement: { achievementName: "ACH_1", unlocked: true } },
                    ],
                  },
                ],
              },
            },
          },
        })
      );

    const data = await getEpicGameAchievements({
      appId: 101,
      gameName: "Super Game",
      accessToken: "access_token",
      accountId: "acc_id",
      sandboxId: "sandbox_super_game",
    });

    expect(data).not.toBeNull();
    expect(data?.sandboxId).toBe("sandbox_super_game");
    expect(data?.unlockedIds).toEqual(["epic_ach_1"]);
    expect(data?.totalUnlocked).toBe(1);
  });

  it("returns null if user has no stored credentials in getEpicAchievementsForUser", async () => {
    const user = createUser("no_epic_user", "pass123");
    expect(await getEpicAchievementsForUser(user.id, 999, "Game")).toBeNull();
  });
});
