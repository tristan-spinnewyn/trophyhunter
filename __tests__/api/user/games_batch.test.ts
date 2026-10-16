// __tests__/api/user/games_batch.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  getUserOwnedGames,
} from "@/lib/db";
import {
  POST as postGamesHandler,
  DELETE as deleteGamesHandler,
} from "@/app/api/user/games/route";
import type { CookieRecord } from "../../helpers/cookies";
import type { OwnedGame } from "@/lib/types";

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

describe("User Games API - Batch", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();

    const user = createUser("GamesTester", "password123");
    userId = user.id;
    const sessionId = createSession(userId);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });
  });

  it("handles replacePlatform batch", async () => {
    const replaceRes = await postGamesHandler(
      new Request("http://localhost/api/user/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replacePlatform: "epic",
          games: [
            {
              appId: 2002,
              name: "Hades",
              headerImg: "https://example.com/hades.jpg",
              platform: "epic",
              totalAchievements: 49,
              unlockedCount: 10,
              addedAt: new Date().toISOString(),
            },
          ],
        }),
      })
    );
    expect(replaceRes.status).toBe(200);
    const replaceData = await replaceRes.json();
    expect(replaceData.games.some((g: OwnedGame) => g.name === "Hades")).toBe(true);
  });

  it("handles batch deletion of all games", async () => {
    await postGamesHandler(
      new Request("http://localhost/api/user/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: {
            appId: 100,
            name: "Game",
            headerImg: "",
            platform: "steam",
          },
        }),
      })
    );

    const delAllRes = await deleteGamesHandler(
      new Request("http://localhost/api/user/games?all=true", { method: "DELETE" })
    );
    expect(delAllRes.status).toBe(200);
    expect(getUserOwnedGames(userId).length).toBe(0);
  });
});
