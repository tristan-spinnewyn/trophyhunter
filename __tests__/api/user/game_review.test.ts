// __tests__/api/user/game_review.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession, saveUserOwnedGames, getUserOwnedGames } from "@/lib/db";
import { PATCH } from "@/app/api/user/games/route";
import type { CookieRecord } from "../../helpers/cookies";

const { mockCookieStore } = vi.hoisted(() => ({
  mockCookieStore: new Map<string, CookieRecord>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string) => { mockCookieStore.set(name, { name, value }); },
    delete: (name: string) => { mockCookieStore.delete(name); },
  }),
}));

function patch(body: unknown): Request {
  return new Request("http://localhost/api/user/games", { method: "PATCH", body: JSON.stringify(body) });
}

describe("PATCH /api/user/games (review)", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    userId = createUser("ReviewRouteUser", "password123").id;
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(userId) });
    saveUserOwnedGames(userId, [
      { appId: 620, name: "Portal 2", headerImg: "", platform: "steam", totalAchievements: 0, unlockedCount: 0, addedAt: "2026-01-01", status: "completed" },
    ]);
  });

  it("saves a rating and a review", async () => {
    const res = await PATCH(patch({ appId: 620, platform: "steam", rating: 5, review: "Génial." }));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, rating: 5, review: "Génial." });
    expect(getUserOwnedGames(userId)[0]).toMatchObject({ rating: 5, review: "Génial." });
  });

  it("clears them", async () => {
    await PATCH(patch({ appId: 620, platform: "steam", rating: 5, review: "Génial." }));

    await PATCH(patch({ appId: 620, platform: "steam", rating: null, review: "" }));

    expect(getUserOwnedGames(userId)[0].rating).toBeUndefined();
  });

  it("rejects an invalid rating or a missing appId", async () => {
    expect((await PATCH(patch({ appId: 620, platform: "steam", rating: 8 }))).status).toBe(400);
    expect((await PATCH(patch({ platform: "steam", rating: 3 }))).status).toBe(400);
  });

  it("answers 404 for a game outside the collection", async () => {
    expect((await PATCH(patch({ appId: 1, platform: "steam", rating: 3 }))).status).toBe(404);
  });
});
