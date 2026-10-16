import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  saveEpicGameSandboxes,
  getEpicGameSandbox,
} from "@/lib/db";
import {
  parseEpicAuthInput,
  exchangeEpicAuthInput,
  refreshEpicAccessToken,
  loadStoredEpicCredentials,
  storeEpicCredentials,
  withEpicCredentials,
  EpicAuthError,
} from "@/lib/epic/credentials";
import {
  epicAchievementId,
  unwrapPlayerAchievement,
  fetchEpicProductAchievements,
  fetchEpicPlayerUnlockedNames,
  resolveEpicSandboxId,
  getEpicGameAchievements,
} from "@/lib/epic/game-achievements";
import { getEpicAchievementsForUser } from "@/lib/epic/game-details";

describe("Epic Achievements & Credentials", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const db = initDatabase(":memory:");
    setDbForTesting(db);
  });

  describe("lib/db/epic", () => {
    it("persists and retrieves sandboxId for an appId", () => {
      const user = createUser("sandbox_user", "pass123");
      saveEpicGameSandboxes(user.id, [
        { appId: 12345, sandboxId: "ns_alanwake2" },
        { appId: 67890, sandboxId: "ns_control" },
      ]);

      expect(getEpicGameSandbox(user.id, 12345)).toBe("ns_alanwake2");
      expect(getEpicGameSandbox(user.id, 67890)).toBe("ns_control");
      expect(getEpicGameSandbox(user.id, 99999)).toBeNull();
    });

    it("ignores empty sandboxId entries", () => {
      const user = createUser("sandbox_user2", "pass123");
      saveEpicGameSandboxes(user.id, [{ appId: 11111, sandboxId: "" }]);
      expect(getEpicGameSandbox(user.id, 11111)).toBeNull();
    });
  });

  describe("lib/epic/credentials", () => {
    it("parses auth input from JSON, redirect URLs, and raw tokens", () => {
      expect(
        parseEpicAuthInput(JSON.stringify({ authorizationCode: "code_123" }))
      ).toBe("code_123");
      expect(
        parseEpicAuthInput(JSON.stringify({ code: "code_456" }))
      ).toBe("code_456");
      expect(
        parseEpicAuthInput("https://localhost:3000/?code=a1b2c3d4e5f6")
      ).toBe("a1b2c3d4e5f6");
      expect(parseEpicAuthInput("eg1~token_direct")).toBe("eg1~token_direct");
      expect(parseEpicAuthInput("")).toBe("");
      expect(parseEpicAuthInput(null)).toBe("");
    });

    it("exchanges direct eg1~ access token via verify endpoint", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          account_id: "epic_acc_eg1",
          display_name: "DirectUser",
        }),
      } as any);

      const creds = await exchangeEpicAuthInput("eg1~valid_token");
      expect(creds).not.toBeNull();
      expect(creds?.accountId).toBe("epic_acc_eg1");
      expect(creds?.accessToken).toBe("eg1~valid_token");
    });

    it("exchanges authorization code via token endpoint", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "exchanged_access",
          refresh_token: "exchanged_refresh",
          account_id: "epic_acc_code",
          displayName: "CodeUser",
        }),
      } as any);

      const creds = await exchangeEpicAuthInput("auth_code_xyz");
      expect(creds).not.toBeNull();
      expect(creds?.accessToken).toBe("exchanged_access");
      expect(creds?.refreshToken).toBe("exchanged_refresh");
    });

    it("returns null if token exchange fails", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as any);

      const creds = await exchangeEpicAuthInput("bad_code");
      expect(creds).toBeNull();
    });

    it("stores and loads credentials from SQLite", () => {
      const user = createUser("creds_user", "pass123");
      storeEpicCredentials(user.id, {
        accessToken: "stored_token",
        refreshToken: "stored_refresh",
        accountId: "stored_acc",
        displayName: "StoredHero",
      });

      const loaded = loadStoredEpicCredentials(user.id);
      expect(loaded).toEqual({
        accessToken: "stored_token",
        refreshToken: "stored_refresh",
        accountId: "stored_acc",
      });
    });

    it("withEpicCredentials refreshes token on EpicAuthError", async () => {
      const user = createUser("refresh_tester", "pass123");
      const creds = {
        accessToken: "expired_token",
        refreshToken: "valid_refresh",
        accountId: "acc_refresh",
      };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "fresh_token_123",
          refresh_token: "fresh_refresh_456",
          account_id: "acc_refresh",
        }),
      } as any);

      let attempts = 0;
      const { result, expired } = await withEpicCredentials(
        creds,
        async (c) => {
          attempts++;
          if (attempts === 1) {
            throw new EpicAuthError();
          }
          return `success with ${c.accessToken}`;
        },
        user.id
      );

      expect(attempts).toBe(2);
      expect(expired).toBe(false);
      expect(result).toBe("success with fresh_token_123");
    });
  });

  describe("lib/epic/game-achievements", () => {
    it("generates formatted slugs and unwraps player achievement objects", () => {
      expect(epicAchievementId("First Blood")).toBe("epic_first_blood");
      expect(
        unwrapPlayerAchievement({
          playerAchievement: { achievementName: "ACH_1", unlocked: true },
        })
      ).toEqual({ achievementName: "ACH_1", unlocked: true });
      expect(
        unwrapPlayerAchievement({ achievementName: "ACH_2", unlocked: false })
      ).toEqual({ achievementName: "ACH_2", unlocked: false });
    });

    it("fetches product achievements definitions from GraphQL", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            Achievement: {
              productAchievementsRecordBySandbox: {
                totalAchievements: 2,
                achievements: [
                  {
                    achievement: {
                      name: "ACH_START",
                      unlockedDisplayName: "Premier pas",
                      unlockedDescription: "Avoir commencé",
                      unlockedIconLink: "https://epic.com/icon1.png",
                      hidden: false,
                      rarity: { percent: 95.5 },
                    },
                  },
                ],
              },
            },
          },
        }),
      } as any);

      const list = await fetchEpicProductAchievements("sandbox_test", "token_123");
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe("epic_ach_start");
      expect(list[0].name).toBe("Premier pas");
      expect(list[0].percent).toBe(95.5);
    });

    it("fetches player unlocked names from GraphQL", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            PlayerAchievement: {
              playerAchievementGameRecordsBySandbox: {
                records: [
                  {
                    totalUnlocked: 1,
                    playerAchievements: [
                      {
                        playerAchievement: {
                          achievementName: "ACH_START",
                          unlocked: true,
                        },
                      },
                      {
                        playerAchievement: {
                          achievementName: "ACH_END",
                          unlocked: false,
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
        }),
      } as any);

      const { unlockedNames, totalUnlocked } =
        await fetchEpicPlayerUnlockedNames("acc_1", "sandbox_1", "token_1");
      expect(totalUnlocked).toBe(1);
      expect(unlockedNames.has("ACH_START")).toBe(true);
      expect(unlockedNames.has("ACH_END")).toBe(false);
    });

    it("resolves sandboxId from library items by appId hash or title", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            {
              appName: "AlanWake2",
              catalogNamespace: "ns_alanwake2_hex",
              metadata: { title: "Alan Wake 2" },
            },
          ],
        }),
      } as any);

      const resolved = await resolveEpicSandboxId(99999, "Alan Wake 2", "token_1");
      expect(resolved).toBe("ns_alanwake2_hex");
    });

    it("getEpicGameAchievements returns combined game definitions and player unlocks", async () => {
      // 1. fetchEpicProductAchievements GraphQL
      vi.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
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
                    {
                      achievement: {
                        name: "ACH_2",
                        unlockedDisplayName: "Champion",
                        unlockedDescription: "Gagner 10 matches",
                        unlockedIconLink: "https://epic.com/champ.png",
                        hidden: true,
                        rarity: { percent: 10 },
                      },
                    },
                  ],
                },
              },
            },
          }),
        } as any)
        // 2. fetchEpicPlayerUnlockedNames GraphQL
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              PlayerAchievement: {
                playerAchievementGameRecordsBySandbox: {
                  records: [
                    {
                      totalUnlocked: 1,
                      playerAchievements: [
                        {
                          playerAchievement: {
                            achievementName: "ACH_1",
                            unlocked: true,
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          }),
        } as any);

      const data = await getEpicGameAchievements({
        appId: 101,
        gameName: "Super Game",
        accessToken: "access_token",
        accountId: "acc_id",
        sandboxId: "sandbox_super_game",
      });

      expect(data).not.toBeNull();
      expect(data?.sandboxId).toBe("sandbox_super_game");
      expect(data?.achievements).toHaveLength(2);
      expect(data?.unlockedIds).toEqual(["epic_ach_1"]);
      expect(data?.unlockedTitles).toEqual(["Victoire"]);
      expect(data?.totalUnlocked).toBe(1);
    });
  });

  describe("lib/epic/game-details", () => {
    it("returns null if user has no stored Epic credentials", async () => {
      const user = createUser("no_epic_user", "pass123");
      const res = await getEpicAchievementsForUser(user.id, 999, "Game");
      expect(res).toBeNull();
    });

    it("returns official Epic achievements when credentials exist", async () => {
      const user = createUser("with_epic_user", "pass123");
      storeEpicCredentials(user.id, {
        accessToken: "valid_epic_token",
        refreshToken: "refresh",
        accountId: "epic_acc_user",
      });
      saveEpicGameSandboxes(user.id, [{ appId: 555, sandboxId: "ns_game555" }]);

      // Mock Product Achievements GraphQL
      vi.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              Achievement: {
                productAchievementsRecordBySandbox: {
                  totalAchievements: 1,
                  achievements: [
                    {
                      achievement: {
                        name: "FIRST_TROPHY",
                        unlockedDisplayName: "Premier Trophée",
                        unlockedDescription: "Bravo",
                        unlockedIconLink: "https://epic.com/first.png",
                        hidden: false,
                        rarity: { percent: 80 },
                      },
                    },
                  ],
                },
              },
            },
          }),
        } as any)
        // Mock Player Unlocks GraphQL
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              PlayerAchievement: {
                playerAchievementGameRecordsBySandbox: {
                  records: [
                    {
                      totalUnlocked: 1,
                      playerAchievements: [
                        {
                          playerAchievement: {
                            achievementName: "FIRST_TROPHY",
                            unlocked: true,
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          }),
        } as any);

      const achs = await getEpicAchievementsForUser(user.id, 555, "Test Game");
      expect(achs).not.toBeNull();
      expect(achs).toHaveLength(1);
      expect(achs![0].name).toBe("Premier Trophée");
    });
  });
});
