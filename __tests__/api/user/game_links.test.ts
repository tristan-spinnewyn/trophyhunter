// __tests__/api/user/game_links.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession, saveUserOwnedGames, getUserOwnedGames } from "@/lib/db";
import { POST, DELETE } from "@/app/api/user/game-links/route";
import { makeOwnedGame } from "../../helpers/gameFixtures";
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

const request = (method: string, body: unknown) =>
  new Request("http://localhost/api/user/game-links", { method, body: JSON.stringify(body) });

const steam = { platform: "steam", appId: 1 };
const xbox = { platform: "xbox", appId: 2 };

describe("/api/user/game-links", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    userId = createUser("LinkRoute", "password123").id;
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(userId) });
    saveUserOwnedGames(userId, [
      makeOwnedGame({ appId: 1, platform: "steam", name: "Hades" }),
      makeOwnedGame({ appId: 2, platform: "xbox", name: "Hades" }),
    ]);
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("merges copies into a primary game, then unmerges them", async () => {
    const merged = await POST(request("POST", { primary: steam, copies: [xbox] }));
    expect(merged.status).toBe(200);
    expect(getUserOwnedGames(userId).find((g) => g.appId === 2)?.mergedInto).toEqual(steam);

    const unmerged = await DELETE(request("DELETE", { primary: steam }));
    expect(unmerged.status).toBe(200);
    expect(getUserOwnedGames(userId).find((g) => g.appId === 2)?.mergedInto).toBeUndefined();
  });

  it("rejects malformed game references", async () => {
    expect((await POST(request("POST", { primary: steam, copies: [] }))).status).toBe(400);
    expect((await POST(request("POST", { primary: { platform: "nintendo64", appId: 1 }, copies: [xbox] }))).status).toBe(400);
    expect((await POST(request("POST", { primary: steam, copies: [{ platform: "xbox", appId: "2" }] }))).status).toBe(400);
    expect((await DELETE(request("DELETE", { primary: null }))).status).toBe(400);
  });

  it("answers 404 for games outside the collection or nothing to unmerge", async () => {
    expect((await POST(request("POST", { primary: steam, copies: [{ platform: "gog", appId: 7 }] }))).status).toBe(404);
    expect((await DELETE(request("DELETE", { primary: steam }))).status).toBe(404);
  });

  it("refuses a visitor", async () => {
    mockCookieStore.clear();

    expect((await POST(request("POST", { primary: steam, copies: [xbox] }))).status).toBe(401);
    expect((await DELETE(request("DELETE", { primary: steam }))).status).toBe(401);
  });
});
