// __tests__/api/user/games.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  getUserOwnedGames,
} from "@/lib/db";
import {
  GET as getGamesHandler,
  POST as postGamesHandler,
  DELETE as deleteGamesHandler,
} from "@/app/api/user/games/route";
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

describe("User Games API - Single", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();

    const user = createUser("GamesTester", "password123");
    userId = user.id;
    const sessionId = createSession(userId);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });
  });

  it("returns 401 when unauthenticated", async () => {
    mockCookieStore.clear();
    expect((await getGamesHandler()).status).toBe(401);

    const postRes = await postGamesHandler(
      new Request("http://localhost/api/user/games", {
        method: "POST",
        body: JSON.stringify({ game: { appId: 1, name: "G", platform: "steam" } }),
      })
    );
    expect(postRes.status).toBe(401);

    const deleteRes = await deleteGamesHandler(
      new Request("http://localhost/api/user/games?appId=1", { method: "DELETE" })
    );
    expect(deleteRes.status).toBe(401);
  });

  it("adds, retrieves and removes games", async () => {
    const postRes = await postGamesHandler(
      new Request("http://localhost/api/user/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: {
            appId: 1091500,
            name: "Cyberpunk 2077",
            headerImg: "https://example.com/cp.jpg",
            platform: "steam",
            totalAchievements: 45,
            unlockedCount: 10,
          },
        }),
      })
    );
    expect(postRes.status).toBe(200);

    const getRes = await getGamesHandler();
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.games.length).toBe(1);

    const deleteRes = await deleteGamesHandler(
      new Request("http://localhost/api/user/games?appId=1091500&platform=steam", {
        method: "DELETE",
      })
    );
    expect(deleteRes.status).toBe(200);
    expect(getUserOwnedGames(userId).length).toBe(0);
  });
});
