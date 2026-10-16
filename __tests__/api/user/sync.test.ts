// __tests__/api/user/sync.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession } from "@/lib/db";
import { GET as getSyncHandler, POST as postSyncHandler } from "@/app/api/user/sync/route";
import type { CookieRecord } from "../../helpers/cookies";

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

describe("User Sync API", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();

    const user = createUser("SyncTester", "password123", "Sync Display");
    const sessionId = createSession(user.id);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });
  });

  it("returns 401 when unauthenticated", async () => {
    mockCookieStore.clear();
    expect((await getSyncHandler()).status).toBe(401);

    const postRes = await postSyncHandler(
      new Request("http://localhost/api/user/sync", { method: "POST" })
    );
    expect(postRes.status).toBe(401);
  });

  it("syncs and retrieves client state", async () => {
    const syncPayload = {
      profile: {
        displayName: "Sync Display",
        accounts: {
          steam: {
            platform: "steam",
            username: "76561198000000000",
            displayName: "SyncSteam",
            connectedAt: new Date().toISOString(),
            stats: { gamesOwned: 1, totalAchievements: 10, completedGames: 1 },
          },
        },
      },
      steamApiKey: "ENC_KEY_TEST_XYZ",
      games: [
        {
          appId: 730,
          name: "Counter-Strike 2",
          headerImg: "https://example.com/cs2.jpg",
          platform: "steam",
          totalAchievements: 1,
          unlockedCount: 1,
          addedAt: new Date().toISOString(),
        },
      ],
      progress: { steam_730: { unlockedIds: ["CS2_ACH_1"], notes: {} } },
      favorites: [730],
      wishlist: [730],
      collections: [
        { name: "FPS", description: "FPS games", color: "#10b981", gameIds: [730] },
      ],
    };

    const postRes = await postSyncHandler(
      new Request("http://localhost/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncPayload),
      })
    );
    expect(postRes.status).toBe(200);

    const getRes = await getSyncHandler();
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.games.length).toBe(1);
    expect(getData.games[0].name).toBe("Counter-Strike 2");
  });
});
