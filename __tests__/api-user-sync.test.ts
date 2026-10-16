import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
} from "@/lib/db";
import { GET as getSyncHandler, POST as postSyncHandler } from "@/app/api/user/sync/route";

const mockCookieStore = new Map<string, any>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string, options: any) => {
      mockCookieStore.set(name, { name, value, ...options });
    },
    delete: (name: string) => {
      mockCookieStore.delete(name);
    },
  }),
}));

describe("User Sync API (/api/user/sync)", () => {
  let userId: string;

  beforeEach(() => {
    const db = initDatabase(":memory:");
    setDbForTesting(db);
    mockCookieStore.clear();

    const user = createUser("SyncTester", "password123", "Sync Display");
    userId = user.id;
    const sessionId = createSession(userId);
    mockCookieStore.set("trophyhunter_session", { value: sessionId });
  });

  it("returns 401 when unauthenticated", async () => {
    mockCookieStore.clear();
    const res = await getSyncHandler();
    expect(res.status).toBe(401);

    const postRes = await postSyncHandler(new Request("http://localhost/api/user/sync", { method: "POST" }));
    expect(postRes.status).toBe(401);
  });

  it("syncs data from client and allows retrieval", async () => {
    const syncPayload = {
      profile: {
        displayName: "Sync Display",
        accounts: {
          steam: {
            platform: "steam",
            username: "76561198083390097",
            displayName: "SyncSteam",
            connectedAt: new Date().toISOString(),
            stats: {
              gamesOwned: 1,
              totalAchievements: 10,
              completedGames: 1,
            },
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
      progress: {
        steam_730: {
          unlockedIds: ["CS2_ACH_1"],
          notes: {},
        },
      },
    };

    const postReq = new Request("http://localhost/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(syncPayload),
    });

    const postRes = await postSyncHandler(postReq);
    expect(postRes.status).toBe(200);
    const postData = await postRes.json();
    expect(postData.success).toBe(true);
    expect(postData.gamesCount).toBe(1);

    const getRes = await getSyncHandler();
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.games.length).toBe(1);
    expect(getData.games[0].name).toBe("Counter-Strike 2");
    expect(getData.steamApiKey).toBe("ENC_KEY_TEST_XYZ");
    expect(getData.profile.accounts.steam).toBeDefined();
  });
});
