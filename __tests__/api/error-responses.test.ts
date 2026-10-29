// __tests__/api/error-responses.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as searchGet } from "@/app/api/search/route";
import { GET as gameGet } from "@/app/api/game/[id]/route";
import { GET as syncGet } from "@/app/api/sync/route";
import { POST as steamPost } from "@/app/api/profile/steam/route";
import { POST as gogPost } from "@/app/api/profile/gog/route";
import { POST as userGamesPost, PATCH as userGamesPatch, DELETE as userGamesDelete } from "@/app/api/user/games/route";
import { POST as favoritePost } from "@/app/api/user/favorite/route";
import { POST as progressPost, DELETE as progressDelete } from "@/app/api/user/progress/route";
import { POST as accountPost } from "@/app/api/user/account/route";
import * as db from "@/lib/db";
import * as steamGameDetails from "@/lib/steam/game-details";
import type { CookieRecord } from "../helpers/cookies";
import { profileSyncRequest } from "../helpers/profileRequests";

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

const INTERNAL = "ECONNRESET 10.0.0.7:443 at /app/lib/internal.ts:42";

async function expectNoInternalDetails(res: Response) {
  expect(res.status).toBe(500);
  const body = await res.json();
  expect(body).not.toHaveProperty("details");
  expect(JSON.stringify(body)).not.toContain(INTERNAL);
  expect(typeof body.error).toBe("string");
}

describe("500 responses do not leak internal error messages", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    db.setDbForTesting(db.initDatabase(":memory:"));
    mockCookieStore.clear();
  });

  describe("routes calling third-party services", () => {
    beforeEach(() => {
      vi.spyOn(global, "fetch").mockRejectedValue(new Error(INTERNAL));
    });

    it("GET /api/search", async () => {
      await expectNoInternalDetails(await searchGet(new Request("http://localhost/api/search?q=portal")));
    });

    it("GET /api/game/[id]", async () => {
      vi.spyOn(steamGameDetails, "getSteamGameDetails").mockRejectedValue(new Error(INTERNAL));
      const res = await gameGet(new Request("http://localhost/api/game/400"), { params: Promise.resolve({ id: "400" }) });
      await expectNoInternalDetails(res);
    });

    it("GET /api/sync for Steam", async () => {
      await expectNoInternalDetails(await syncGet(new Request("http://localhost/api/sync?user=76561198000000000&appId=400")));
    });

    it("POST /api/profile/steam", async () => {
      await expectNoInternalDetails(await steamPost(profileSyncRequest("steam", { user: "76561198000000000" })));
    });

    it("POST /api/profile/gog", async () => {
      await expectNoInternalDetails(await gogPost(profileSyncRequest("gog", { user: "someone" })));
    });
  });

  describe("signed-in routes receiving a malformed body", () => {
    const malformed = (url: string, method: string) =>
      new Request(url, { method, headers: { "Content-Type": "application/json" }, body: "{not json" });

    beforeEach(() => {
      const user = db.createUser("owner", "password123");
      mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: db.createSession(user.id) });
    });

    it.each([
      ["POST /api/user/games", () => userGamesPost(malformed("http://localhost/api/user/games", "POST"))],
      ["PATCH /api/user/games", () => userGamesPatch(malformed("http://localhost/api/user/games", "PATCH"))],
      ["POST /api/user/favorite", () => favoritePost(malformed("http://localhost/api/user/favorite", "POST"))],
      ["POST /api/user/progress", () => progressPost(malformed("http://localhost/api/user/progress", "POST"))],
      ["POST /api/user/account", () => accountPost(malformed("http://localhost/api/user/account", "POST"))],
    ])("%s answers with its own message, not the parser error", async (_label, call) => {
      const res = await call();
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).not.toMatch(/JSON|Unexpected|token/i);
    });

    it("DELETE /api/user/games hides an unexpected database error", async () => {
      vi.spyOn(db, "removeUserPlatformGames").mockImplementation(() => { throw new Error(INTERNAL); });
      await expectNoInternalDetails(
        await userGamesDelete(new Request("http://localhost/api/user/games?platform=steam", { method: "DELETE" }))
      );
    });

    it("DELETE /api/user/progress hides an unexpected database error", async () => {
      vi.spyOn(db, "resetUserGameProgress").mockImplementation(() => { throw new Error(INTERNAL); });
      await expectNoInternalDetails(
        await progressDelete(new Request("http://localhost/api/user/progress?appId=400&platform=steam", { method: "DELETE" }))
      );
    });
  });
});
