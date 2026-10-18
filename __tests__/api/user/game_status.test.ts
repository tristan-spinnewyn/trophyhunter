// __tests__/api/user/game_status.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  saveUserOwnedGames,
  getUserGameStatus,
} from "@/lib/db";
import { PATCH as patchGamesHandler } from "@/app/api/user/games/route";
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

describe("PATCH /api/user/games (Game Status)", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    const user = createUser("PatchStatusUser", "password123");
    userId = user.id;
    const sessionId = createSession(userId);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });
  });

  it("returns 401 when unauthenticated and 400 on invalid payload", async () => {
    mockCookieStore.clear();
    const unauthRes = await patchGamesHandler(
      new Request("http://localhost/api/user/games", {
        method: "PATCH",
        body: JSON.stringify({ appId: 10, platform: "steam", status: "completed" }),
      })
    );
    expect(unauthRes.status).toBe(401);

    const sessionId = createSession(userId);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });

    const missingIdRes = await patchGamesHandler(
      new Request("http://localhost/api/user/games", {
        method: "PATCH",
        body: JSON.stringify({ platform: "steam", status: "completed" }),
      })
    );
    expect(missingIdRes.status).toBe(400);

    const badStatusRes = await patchGamesHandler(
      new Request("http://localhost/api/user/games", {
        method: "PATCH",
        body: JSON.stringify({ appId: 10, platform: "steam", status: "invalid-status" }),
      })
    );
    expect(badStatusRes.status).toBe(400);
  });

  it("updates game status across platforms", async () => {
    saveUserOwnedGames(userId, [
      { appId: 500, name: "Left 4 Dead 2", headerImg: "", platform: "steam", totalAchievements: 101, unlockedCount: 20, addedAt: "2026-01-01" },
      { appId: 600, name: "Forza Horizon", headerImg: "", platform: "xbox", totalAchievements: 80, unlockedCount: 15, addedAt: "2026-01-01" },
    ]);

    const res = await patchGamesHandler(
      new Request("http://localhost/api/user/games", {
        method: "PATCH",
        body: JSON.stringify({ appId: 500, platform: "steam", status: "completed" }),
      })
    );
    expect(res.status).toBe(200);
    expect(getUserGameStatus(userId, 500, "steam")).toBe("completed");
    expect(getUserGameStatus(userId, 600, "xbox")).toBe("backlog");
  });
});
