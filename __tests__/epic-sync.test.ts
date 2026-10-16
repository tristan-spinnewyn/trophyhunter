import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  saveUserPlatformAccount,
  getUserPlatformAccounts,
  saveUserOwnedGames,
  saveUserGameProgress,
  getUserGameProgress,
} from "@/lib/db";
import {
  refreshEpicAccessToken,
  fetchEpicPlayerAchievements,
  syncEpicGame,
} from "@/lib/epic-sync";

const mockCookieStore = new Map<string, any>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string, options: any) =>
      mockCookieStore.set(name, { name, value, ...options }),
    delete: (name: string) => mockCookieStore.delete(name),
  }),
}));

describe("lib/epic-sync", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const db = initDatabase(":memory:");
    setDbForTesting(db);
    mockCookieStore.clear();
  });

  describe("refreshEpicAccessToken", () => {
    it("successfully refreshes token with Epic OAuth API", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "new_access_token_123",
          refresh_token: "new_refresh_token_456",
          account_id: "epic_acc_789",
        }),
      } as any);

      const result = await refreshEpicAccessToken("old_refresh_token");
      expect(result).toEqual({
        accessToken: "new_access_token_123",
        refreshToken: "new_refresh_token_456",
        accountId: "epic_acc_789",
      });
    });

    it("returns null when refresh request fails or throws", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as any);

      const result = await refreshEpicAccessToken("invalid_refresh_token");
      expect(result).toBeNull();

      vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));
      const resultErr = await refreshEpicAccessToken("some_token");
      expect(resultErr).toBeNull();
    });
  });

  describe("fetchEpicPlayerAchievements", () => {
    it("fetches player achievements from GraphQL endpoint", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            PlayerAchievement: {
              playerAchievementGameRecords: {
                records: [
                  {
                    sandboxId: "ns_alanwake2_sandbox",
                    totalUnlocked: 12,
                    totalXP: 350,
                    playerAchievements: [
                      { achievementName: "Escape the Dark", unlocked: true },
                    ],
                  },
                ],
              },
            },
          },
        }),
      } as any);

      const records = await fetchEpicPlayerAchievements("acc_123", "token_abc");
      expect(records).toHaveLength(1);
      expect(records[0].sandboxId).toBe("ns_alanwake2_sandbox");
      expect(records[0].totalUnlocked).toBe(12);
    });

    it("returns empty array on error", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as any);

      const records = await fetchEpicPlayerAchievements("acc_123", "token_abc");
      expect(records).toEqual([]);

      vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("GraphQL down"));
      const recordsErr = await fetchEpicPlayerAchievements("acc_123", "token_abc");
      expect(recordsErr).toEqual([]);
    });
  });

  describe("syncEpicGame", () => {
    it("handles unauthenticated request safely", async () => {
      const req = new Request("http://localhost:3000/api/sync?platform=epic&appId=12345");
      const result = await syncEpicGame(req, 12345, "Hades");

      expect(result.success).toBe(true);
      expect(result.platform).toBe("epic");
      expect(result.gameName).toBe("Hades");
      expect(result.count).toBe(0);
      expect(result.unlockedIds).toEqual([]);
    });

    it("syncs achievements via Epic GraphQL for authenticated user", async () => {
      const user = createUser("epicgamer", "hashed_password");
      const session = createSession(user.id);
      mockCookieStore.set("trophyhunter_session", { value: session });

      saveUserPlatformAccount(
        user.id,
        {
          platform: "epic",
          username: "EpicMaster",
          displayName: "Epic Master",
          connectedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          stats: { gamesOwned: 1, totalAchievements: 10, completedGames: 0 },
        },
        JSON.stringify({
          accessToken: "valid_epic_access_token",
          refreshToken: "valid_epic_refresh_token",
          accountId: "epic_account_123",
        })
      );

      saveUserOwnedGames(user.id, [
        {
          appId: 99901,
          name: "Alan Wake 2",
          headerImg: "https://img.epic.com/aw2.jpg",
          platform: "epic",
          totalAchievements: 0,
          unlockedCount: 0,
          addedAt: new Date().toISOString(),
          source: "manual",
        },
      ]);

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            PlayerAchievement: {
              playerAchievementGameRecords: {
                records: [
                  {
                    sandboxId: "alanwake2",
                    totalUnlocked: 2,
                    achievementSets: [{ totalAchievements: 30, totalUnlocked: 2 }],
                    playerAchievements: [
                      { achievementName: "The Writer", unlocked: true },
                      { achievementName: "Shadow Walker", unlocked: true },
                      { achievementName: "Master of Shadows", unlocked: false },
                    ],
                  },
                ],
              },
            },
          },
        }),
      } as any);

      const req = new Request(
        "http://localhost:3000/api/sync?platform=epic&appId=99901&gameName=Alan%20Wake%202"
      );
      const result = await syncEpicGame(req, 99901, "Alan Wake 2");

      expect(result.success).toBe(true);
      expect(result.platform).toBe("epic");
      expect(result.count).toBe(2);
      expect(result.totalAchievements).toBe(30);
      expect(result.unlockedTitles).toEqual(["The Writer", "Shadow Walker"]);
      expect(result.unlockedIds).toHaveLength(2);

      // Verify persisted progress in SQLite
      const progress = getUserGameProgress(user.id, 99901, "epic");
      expect(progress).not.toBeNull();
      expect(progress?.unlockedIds).toEqual(result.unlockedIds);
    });

    it("refreshes token when initial achievements fetch is empty", async () => {
      const user = createUser("refreshtest", "pass123");
      const session = createSession(user.id);
      mockCookieStore.set("trophyhunter_session", { value: session });

      saveUserPlatformAccount(
        user.id,
        {
          platform: "epic",
          username: "RefreshUser",
          displayName: "Refresh User",
          connectedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          stats: { gamesOwned: 1, totalAchievements: 5, completedGames: 0 },
        },
        JSON.stringify({
          accessToken: "expired_access_token",
          refreshToken: "good_refresh_token",
          accountId: "epic_account_456",
        })
      );

      // 1st fetch: empty records
      vi.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { PlayerAchievement: { playerAchievementGameRecords: { records: [] } } },
          }),
        } as any)
        // 2nd fetch: token refresh
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "refreshed_access_token",
            refresh_token: "new_refresh_token",
            account_id: "epic_account_456",
          }),
        } as any)
        // 3rd fetch: achievements with refreshed token
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              PlayerAchievement: {
                playerAchievementGameRecords: {
                  records: [
                    {
                      sandboxId: "celeste",
                      totalUnlocked: 1,
                      achievementSets: [{ totalAchievements: 15, totalUnlocked: 1 }],
                      playerAchievements: [
                        { achievementName: "Reach Summit", unlocked: true },
                      ],
                    },
                  ],
                },
              },
            },
          }),
        } as any);

      const req = new Request(
        "http://localhost:3000/api/sync?platform=epic&appId=88801&gameName=Celeste"
      );
      const result = await syncEpicGame(req, 88801, "Celeste");

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.totalAchievements).toBe(15);
      expect(result.unlockedTitles).toEqual(["Reach Summit"]);
    });

    it("falls back to SQLite owned games when no matching GraphQL record is found", async () => {
      const user = createUser("fallbackuser", "pass123");
      const session = createSession(user.id);
      mockCookieStore.set("trophyhunter_session", { value: session });

      saveUserPlatformAccount(
        user.id,
        {
          platform: "epic",
          username: "FallbackUser",
          displayName: "Fallback User",
          connectedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          stats: { gamesOwned: 1, totalAchievements: 0, completedGames: 0 },
        },
        JSON.stringify({
          accessToken: "token_123",
          accountId: "acc_123",
        })
      );

      saveUserOwnedGames(user.id, [
        {
          appId: 77701,
          name: "Indie Game",
          headerImg: "https://img.epic.com/indie.jpg",
          platform: "epic",
          totalAchievements: 10,
          unlockedCount: 3,
          addedAt: new Date().toISOString(),
          source: "manual",
        },
      ]);

      saveUserGameProgress(user.id, 77701, "epic", {
        unlockedIds: ["ach_1", "ach_2", "ach_3"],
        lastPlayed: new Date().toISOString(),
        notes: {},
      });

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { PlayerAchievement: { playerAchievementGameRecords: { records: [] } } },
        }),
      } as any);

      const req = new Request(
        "http://localhost:3000/api/sync?platform=epic&appId=77701&gameName=Indie%20Game"
      );
      const result = await syncEpicGame(req, 77701, "Indie Game");

      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
      expect(result.totalAchievements).toBe(10);
      expect(result.unlockedIds).toEqual(["ach_1", "ach_2", "ach_3"]);
    });

    it("accepts authorizationToken in query and exchanges it with Epic OAuth", async () => {
      // 1. OAuth code exchange
      vi.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "mock_exchanged_token",
            refresh_token: "mock_refresh_token",
            account_id: "epic_account_777",
          }),
        } as any)
        // 2. GraphQL achievements
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              PlayerAchievement: {
                playerAchievementGameRecords: {
                  records: [
                    {
                      sandboxId: "supergame",
                      totalUnlocked: 1,
                      achievementSets: [{ totalAchievements: 10, totalUnlocked: 1 }],
                      playerAchievements: [
                        { achievementName: "First Win", unlocked: true },
                      ],
                    },
                  ],
                },
              },
            },
          }),
        } as any);

      const req = new Request(
        "http://localhost:3000/api/sync?platform=epic&appId=55501&name=Super%20Game&authorizationToken=code_12345"
      );
      const result = await syncEpicGame(req, 55501, "Super Game");

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.unlockedTitles).toEqual(["First Win"]);
      expect(result.unlockedIds[0]).toContain("ach_1_first_win");
    });

    it("parses JSON authorizationToken string if user pasted the full object", async () => {
      vi.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "mock_token_from_json",
            refresh_token: "mock_refresh_from_json",
            account_id: "epic_account_888",
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              PlayerAchievement: {
                playerAchievementGameRecords: {
                  records: [],
                },
              },
            },
          }),
        } as any);

      const jsonString = encodeURIComponent(
        JSON.stringify({
          redirectUrl: "https://localhost/?code=auth_code_from_json",
          authorizationCode: "auth_code_from_json",
        })
      );
      const req = new Request(
        `http://localhost:3000/api/sync?platform=epic&appId=55502&name=Some%20Game&authorizationToken=${jsonString}`
      );
      const result = await syncEpicGame(req, 55502, "Some Game");

      expect(result.success).toBe(true);
      expect(result.platform).toBe("epic");
    });

    it("extracts code when authorizationToken contains a URL redirect string", async () => {
      vi.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "mock_token_from_url",
            refresh_token: "mock_refresh_url",
            account_id: "epic_account_url",
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { PlayerAchievement: { playerAchievementGameRecords: { records: [] } } },
          }),
        } as any);

      const req = new Request(
        "http://localhost:3000/api/sync?platform=epic&appId=55503&name=URL%20Game&authorizationToken=https%3A%2F%2Flocalhost%2F%3Fcode%3Da1b2c3d4e5f6"
      );
      const result = await syncEpicGame(req, 55503, "URL Game");

      expect(result.success).toBe(true);
      expect(result.platform).toBe("epic");
    });

    it("generates numbered achievement slugs when unlockedIds is empty but totalUnlocked > 0 in fallback", async () => {
      const user = createUser("numbereduser", "pass123");
      const session = createSession(user.id);
      mockCookieStore.set("trophyhunter_session", { value: session });

      saveUserPlatformAccount(
        user.id,
        {
          platform: "epic",
          username: "NumberedUser",
          displayName: "Numbered User",
          connectedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          stats: { gamesOwned: 1, totalAchievements: 0, completedGames: 0 },
        },
        JSON.stringify({
          accessToken: "token_num",
          accountId: "acc_num",
        })
      );

      saveUserOwnedGames(user.id, [
        {
          appId: 77702,
          name: "Numbered Game",
          headerImg: "https://img.epic.com/num.jpg",
          platform: "epic",
          totalAchievements: 5,
          unlockedCount: 2,
          addedAt: new Date().toISOString(),
          source: "manual",
        },
      ]);

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { PlayerAchievement: { playerAchievementGameRecords: { records: [] } } },
        }),
      } as any);

      const req = new Request(
        "http://localhost:3000/api/sync?platform=epic&appId=77702&gameName=Numbered%20Game"
      );
      const result = await syncEpicGame(req, 77702, "Numbered Game");

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.unlockedIds).toEqual(["ach_1", "ach_2"]);
    });

    it("verifies and accepts direct eg1~ access token and persists account in SQLite for authenticated user", async () => {
      const user = createUser("eg1user", "secretpass123");
      const session = createSession(user.id);
      mockCookieStore.set("trophyhunter_session", { value: session });

      vi.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ account_id: "epic_account_eg1_user" }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              PlayerAchievement: {
                playerAchievementGameRecords: {
                  records: [
                    {
                      sandboxId: "mygame",
                      totalUnlocked: 1,
                      achievementSets: [{ totalAchievements: 5, totalUnlocked: 1 }],
                      playerAchievements: [{ achievementName: "First Steps", unlocked: true }],
                    },
                  ],
                },
              },
            },
          }),
        } as any);

      const req = new Request(
        "http://localhost:3000/api/sync?platform=epic&appId=66601&name=My%20Game&authorizationToken=eg1~direct_valid_token"
      );
      const result = await syncEpicGame(req, 66601, "My Game");

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.unlockedTitles).toEqual(["First Steps"]);

      // Verify account was persisted in SQLite
      const accounts = getUserPlatformAccounts(user.id);
      expect(accounts.epic).toBeDefined();
      expect(accounts.epic?.username).toBe("epic_account_eg1_user");
    });
  });
});

