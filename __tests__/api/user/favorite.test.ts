// __tests__/api/user/favorite.test.ts
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

describe("User Favorite API", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();

    const user = createUser("FavoriteTester", "password123");
    const sessionId = createSession(user.id);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });

    saveUserOwnedGames(user.id, [
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
    expect((await getFavoriteHandler()).status).toBe(401);

    const postRes = await postFavoriteHandler(
      new Request("http://localhost/api/user/favorite", {
        method: "POST",
        body: JSON.stringify({ appId: 200, isFavorite: true }),
      })
    );
    expect(postRes.status).toBe(401);
  });

  it("manages user favorites on GET and POST", async () => {
    const postRes = await postFavoriteHandler(
      new Request("http://localhost/api/user/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: 200, isFavorite: true }),
      })
    );
    expect(postRes.status).toBe(200);

    const getRes = await getFavoriteHandler();
    expect(getRes.status).toBe(200);
    const data = await getRes.json();
    expect(data.favorites).toContain(200);
  });
});
