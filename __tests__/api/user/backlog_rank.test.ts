// __tests__/api/user/backlog_rank.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession, saveUserOwnedGames, getUserOwnedGames } from "@/lib/db";
import { PATCH as patchGamesHandler } from "@/app/api/user/games/route";
import { makeOwnedGame } from "../../helpers/gameFixtures";
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

const patch = (body: unknown) =>
  patchGamesHandler(new Request("http://localhost/api/user/games", { method: "PATCH", body: JSON.stringify(body) }));

describe("PATCH /api/user/games (backlog rank)", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    userId = createUser("PatchRankUser", "password123").id;
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(userId) });
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 500, status: "backlog" })]);
  });

  const storedRank = () => getUserOwnedGames(userId).find((g) => g.appId === 500)?.backlogRank;

  it("queues a game at the given rank and leaves its status alone", async () => {
    const res = await patch({ appId: 500, platform: "steam", backlogRank: -1 });

    expect(res.status).toBe(200);
    expect(storedRank()).toBe(-1);
    expect(getUserOwnedGames(userId)[0].status).toBe("backlog");
  });

  it("takes a game out of the queue with a null rank", async () => {
    await patch({ appId: 500, platform: "steam", backlogRank: 3 });
    const res = await patch({ appId: 500, platform: "steam", backlogRank: null });

    expect(res.status).toBe(200);
    expect(storedRank()).toBeUndefined();
  });

  it("rejects a rank that is not a whole number, and a missing game id", async () => {
    expect((await patch({ appId: 500, platform: "steam", backlogRank: "first" })).status).toBe(400);
    expect((await patch({ appId: 500, platform: "steam", backlogRank: 1.5 })).status).toBe(400);
    expect((await patch({ platform: "steam", backlogRank: 1 })).status).toBe(400);
    expect(storedRank()).toBeUndefined();
  });

  it("stores a whole queue order at once", async () => {
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 501, status: "backlog" })]);

    const res = await patch({ backlogQueue: [{ appId: 501, platform: "steam" }, { appId: 500, platform: "steam" }] });

    expect(res.status).toBe(200);
    const ranks = Object.fromEntries(getUserOwnedGames(userId).map((g) => [g.appId, g.backlogRank]));
    expect(ranks).toEqual({ 500: 1, 501: 0 });
  });

  it("rejects a queue that is not a list of games", async () => {
    expect((await patch({ backlogQueue: "500" })).status).toBe(400);
    expect((await patch({ backlogQueue: [{ appId: "x", platform: "steam" }] })).status).toBe(400);
    expect((await patch({ backlogQueue: [{ appId: 500, platform: "nes" }] })).status).toBe(400);
    expect(storedRank()).toBeUndefined();
  });
});
