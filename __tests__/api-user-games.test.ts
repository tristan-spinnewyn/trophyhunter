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

describe("User Games API (/api/user/games)", () => {
  let userId: string;

  beforeEach(() => {
    const db = initDatabase(":memory:");
    setDbForTesting(db);
    mockCookieStore.clear();

    const user = createUser("GamesTester", "password123");
    userId = user.id;
    const sessionId = createSession(userId);
    mockCookieStore.set("trophyhunter_session", { value: sessionId });
  });

  it("returns 401 when unauthenticated", async () => {
    mockCookieStore.clear();

    const getRes = await getGamesHandler();
    expect(getRes.status).toBe(401);

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

  it("adds, retrieves and removes games for authenticated user", async () => {
    // 1. Add game
    const postReq = new Request("http://localhost/api/user/games", {
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
    });
    const postRes = await postGamesHandler(postReq);
    expect(postRes.status).toBe(200);

    // 2. Retrieve game
    const getRes = await getGamesHandler();
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.games.length).toBe(1);
    expect(getData.games[0].name).toBe("Cyberpunk 2077");

    // 3. Remove game
    const deleteReq = new Request("http://localhost/api/user/games?appId=1091500&platform=steam", {
      method: "DELETE",
    });
    const deleteRes = await deleteGamesHandler(deleteReq);
    expect(deleteRes.status).toBe(200);

    const remaining = getUserOwnedGames(userId);
    expect(remaining.length).toBe(0);
  });
});
