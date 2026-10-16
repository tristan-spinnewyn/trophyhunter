// __tests__/epic/sync_progress.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  saveUserPlatformAccount,
  saveUserOwnedGames,
  getUserGameProgress,
} from "@/lib/db";
import { syncEpicGame } from "@/lib/epic-sync";
import type { CookieRecord } from "../helpers/cookies";
import { jsonResponse } from "../helpers/responses";

const { mockCookieStore } = vi.hoisted(() => ({
  mockCookieStore: new Map<string, CookieRecord>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string, options?: Omit<CookieRecord, "name" | "value">) => {
      mockCookieStore.set(name, { name, value, ...options });
    },
    delete: (name: string) => { mockCookieStore.delete(name); },
  }),
}));

describe("Epic Sync Authenticated Progress", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
  });

  it("syncs achievements via Epic GraphQL and persists to SQLite", async () => {
    const user = createUser("epicgamer", "hashed_password");
    const session = createSession(user.id);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: session });

    saveUserPlatformAccount(
      user.id,
      {
        platform: "epic",
        username: "EpicMaster",
        displayName: "Epic Master",
        connectedAt: new Date().toISOString(),
        stats: { gamesOwned: 1, totalAchievements: 10, completedGames: 0 },
      },
      JSON.stringify({
        accessToken: "valid_epic_access_token",
        refreshToken: "valid_epic_refresh_token",
        accountId: "epic_account_123",
      })
    );

    saveUserOwnedGames(user.id, [{
      appId: 99901,
      name: "Alan Wake 2",
      headerImg: "https://img.epic.com/aw2.jpg",
      platform: "epic",
      totalAchievements: 0,
      unlockedCount: 0,
      addedAt: new Date().toISOString(),
    }]);

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        data: {
          PlayerAchievement: {
            playerAchievementGameRecords: {
              records: [{
                sandboxId: "alanwake2",
                totalUnlocked: 2,
                achievementSets: [{ totalAchievements: 30, totalUnlocked: 2 }],
                playerAchievements: [
                  { achievementName: "The Writer", unlocked: true },
                  { achievementName: "Shadow Walker", unlocked: true },
                ],
              }],
            },
          },
        },
      })
    );

    const req = new Request("http://localhost:3000/api/sync?platform=epic&appId=99901&gameName=Alan%20Wake%202");
    const result = await syncEpicGame(req, 99901, "Alan Wake 2");

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.unlockedTitles).toEqual(["The Writer", "Shadow Walker"]);

    const progress = getUserGameProgress(user.id, 99901, "epic");
    expect(progress).not.toBeNull();
    expect(progress?.unlockedIds).toEqual(result.unlockedIds);
  });
});
