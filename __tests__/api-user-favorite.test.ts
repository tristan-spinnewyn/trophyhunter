import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  saveUserOwnedGames,
} from "@/lib/db";
import {
  GET as getFavoriteHandler,
  POST as postFavoriteHandler,
} from "@/app/api/user/favorite/route";

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

describe("User Favorite API (/api/user/favorite)", () => {
  let userId: string;

  beforeEach(() => {
    const db = initDatabase(":memory:");
    setDbForTesting(db);
    mockCookieStore.clear();

    const user = createUser("FavoriteTester", "password123");
    userId = user.id;
    const sessionId = createSession(userId);
    mockCookieStore.set("trophyhunter_session", { value: sessionId });

    saveUserOwnedGames(userId, [
      {
        appId: 200,
        name: "Favorite Test Game",
        headerImg: "",
        platform: "steam",
        totalAchievements: 5,
        unlockedCount: 0,
        addedAt: new Date().toISOString(),
      },
    ]);
  });

  it("returns 401 when unauthenticated", async () => {
    mockCookieStore.clear();

    const getRes = await getFavoriteHandler();
    expect(getRes.status).toBe(401);

    const postRes = await postFavoriteHandler(
      new Request("http://localhost/api/user/favorite", {
        method: "POST",
        body: JSON.stringify({ appId: 200, isFavorite: true }),
      })
    );
    expect(postRes.status).toBe(401);
  });

  it("toggles and retrieves favorite games for authenticated user", async () => {
    // 1. Initial list is empty
    const getRes1 = await getFavoriteHandler();
    expect(getRes1.status).toBe(200);
    const data1 = await getRes1.json();
    expect(data1.favorites).toEqual([]);

    // 2. Mark as favorite
    const postReq = new Request("http://localhost/api/user/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId: 200, platform: "steam", isFavorite: true }),
    });
    const postRes = await postFavoriteHandler(postReq);
    expect(postRes.status).toBe(200);

    // 3. Check list
    const getRes2 = await getFavoriteHandler();
    const data2 = await getRes2.json();
    expect(data2.favorites).toContain(200);

    // 4. Unfavorite
    const postUnfav = new Request("http://localhost/api/user/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId: 200, platform: "steam", isFavorite: false }),
    });
    await postFavoriteHandler(postUnfav);

    const getRes3 = await getFavoriteHandler();
    const data3 = await getRes3.json();
    expect(data3.favorites).not.toContain(200);
  });
});
