// __tests__/epic/sandbox_resolver.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { initDatabase, setDbForTesting, createUser, saveEpicGameSandboxes, getEpicGameSandbox } from "@/lib/db";
import { resolveEpicSandboxId } from "@/lib/epic/game-achievements";
import { resolveEpicGameData } from "@/lib/epic/sync-resolver";
import { jsonResponse } from "../helpers/responses";

describe("Epic Sandbox Resolution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("persists and retrieves sandbox IDs in database", () => {
    const user = createUser("sandbox_user", "pass123");
    saveEpicGameSandboxes(user.id, [
      { appId: 12345, sandboxId: "ns_alanwake2" },
      { appId: 67890, sandboxId: "ns_control" },
      { appId: 11111, sandboxId: "" },
    ]);

    expect(getEpicGameSandbox(user.id, 12345)).toBe("ns_alanwake2");
    expect(getEpicGameSandbox(user.id, 67890)).toBe("ns_control");
    expect(getEpicGameSandbox(user.id, 11111)).toBeNull();
    expect(getEpicGameSandbox(user.id, 99999)).toBeNull();
  });

  it("resolves sandboxId from library items by title", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        records: [{ appName: "AlanWake2", catalogNamespace: "ns_alanwake2_hex", metadata: { title: "Alan Wake 2" } }],
      })
    );

    const resolved = await resolveEpicSandboxId(99999, "Alan Wake 2", "token_1");
    expect(resolved).toBe("ns_alanwake2_hex");
  });

  it("resolves game data via library sandbox and fallback player unlocked names", async () => {
    const user = createUser("resolver_user", "pass123");
    const summaries = [{ sandboxId: "other_sb", product: { name: "Other Game" }, productAchievements: { totalAchievements: 10 } }];
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            PlayerAchievement: { playerAchievementGameRecords: { records: [{ sandboxId: "other_sb", totalUnlocked: 1 }] } },
            PlayerProfile: { playerProfile: { achievementsSummaries: { data: summaries } } },
          },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({ records: [{ appName: "MyGame", catalogNamespace: "target_sb", metadata: { title: "My Target Game" } }] })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: { Achievement: { productAchievementsRecordBySandbox: { achievements: [{ achievement: { name: "ACH_1", unlockedDisplayName: "First Step" } }] } } },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: { PlayerAchievement: { playerAchievementGameRecordsBySandbox: { records: [{ totalUnlocked: 1, playerAchievements: [{ playerAchievement: { achievementName: "ACH_1", unlocked: true } }] }] } } },
        })
      );

    const res = await resolveEpicGameData(
      { accountId: "acc_1", accessToken: "tok_1", refreshToken: "ref_1" },
      user,
      77777,
      "mytargetgame",
      "My Target Game"
    );

    expect(res.matchedRecord?.sandboxId).toBe("target_sb");
    expect(res.matchedRecord?.totalUnlocked).toBe(1);
    expect(res.productAchievements).toHaveLength(1);
  });
});
