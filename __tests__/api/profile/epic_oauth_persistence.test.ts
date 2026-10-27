// __tests__/api/profile/epic_oauth_persistence.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/profile/epic/route";
import { syncEpicProfileWithOAuth } from "@/lib/epic/profile-sync";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  getUserOwnedGames,
  getUserPlatformAccounts,
  getUserGameProgress,
} from "@/lib/db";
import type { CookieRecord } from "../../helpers/cookies";
import { emptyThirdPartyResponse, jsonResponse } from "../../helpers/responses";

const { mockCookieStore } = vi.hoisted(() => ({
  mockCookieStore: new Map<string, CookieRecord>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string, options?: Omit<CookieRecord, "name" | "value">) => {
      mockCookieStore.set(name, { name, value, ...options });
    },
    delete: (name: string) => {
      mockCookieStore.delete(name);
    },
  }),
}));

describe("GET /api/profile/epic OAuth Persistence", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
  });

  it("persists account, games, and progress in SQLite for authenticated user", async () => {
    const user = createUser("epicuser", "hashedpassword123");
    const sessionId = createSession(user.id);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });

    const mockToken = { access_token: "auth_token", account_id: "epic_777", displayName: "EpicHero" };
    const mockLibrary = {
      records: [
        { appName: "GameWithAch", catalogItemId: "cat_gw", namespace: "ns_gw_ach", sandboxName: "Game With Ach" },
      ],
    };
    const mockGql = {
      data: {
        PlayerAchievement: {
          playerAchievementGameRecords: {
            records: [
              {
                sandboxId: "ns_gw_ach",
                totalUnlocked: 1,
                achievementSets: [{ totalAchievements: 5, totalUnlocked: 1 }],
                playerAchievements: [{ achievementName: "First Blood", unlocked: true }],
              },
            ],
          },
        },
      },
    };

    vi.spyOn(global, "fetch").mockImplementation(emptyThirdPartyResponse)
      .mockResolvedValueOnce(jsonResponse(mockToken))
      .mockResolvedValueOnce(jsonResponse(mockLibrary))
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(jsonResponse(mockGql));

    const res = await GET(new Request("http://localhost:3000/api/profile/epic", { headers: { "x-authorization-token": "oauth-hero-code" } }));
    expect(res.status).toBe(200);

    expect(getUserPlatformAccounts(user.id).epic?.displayName).toBe("EpicHero");
    const games = getUserOwnedGames(user.id);
    expect(games.length).toBeGreaterThan(0);
    const progress = getUserGameProgress(user.id, games[0].appId, "epic");
    expect(progress?.unlockedIds).toHaveLength(1);
  });

  it("syncEpicProfileWithOAuth verifies direct access token starting with eg1~", async () => {
    vi.spyOn(global, "fetch").mockImplementation(emptyThirdPartyResponse)
      .mockResolvedValueOnce(jsonResponse({ account_id: "acc_eg1", display_name: "Eg1User" })) // token verify
      .mockResolvedValueOnce(jsonResponse({ records: [] })) // library service
      .mockResolvedValueOnce(jsonResponse([])) // launcher assets fallback
      .mockResolvedValueOnce(jsonResponse([])) // entitlements fallback
      .mockResolvedValueOnce(jsonResponse({ data: { PlayerAchievement: { playerAchievementGameRecords: { records: [] } } } }));

    const res = await syncEpicProfileWithOAuth("eg1~valid_access_token");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.account.displayName).toBe("Eg1User");
    }
  });
});
