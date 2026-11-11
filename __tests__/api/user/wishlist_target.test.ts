// __tests__/api/user/wishlist_target.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession, setGameWishlist, getUserWishlist } from "@/lib/db";
import type { CookieRecord } from "../../helpers/cookies";

const { mockCookieStore } = vi.hoisted(() => ({ mockCookieStore: new Map<string, CookieRecord>() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string) => { mockCookieStore.set(name, { name, value }); },
    delete: (name: string) => { mockCookieStore.delete(name); },
  }),
}));

import { PUT } from "@/app/api/user/wishlist/target/route";

const put = (body: unknown) =>
  new Request("http://localhost:3000/api/user/wishlist/target", { method: "PUT", body: typeof body === "string" ? body : JSON.stringify(body) });

describe("PUT /api/user/wishlist/target", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    userId = createUser("TargetUser", "password123").id;
    setGameWishlist(userId, 620, "steam", true, { name: "Portal 2" });
  });

  const signIn = () => mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(userId) });

  it("refuses anonymous callers", async () => {
    expect((await PUT(put({ appId: 620, targetPriceCents: 500 }))).status).toBe(401);
  });

  it("sets and clears the target price", async () => {
    signIn();

    expect((await PUT(put({ appId: 620, targetPriceCents: 500 }))).status).toBe(200);
    expect(getUserWishlist(userId)[0].targetPriceCents).toBe(500);

    await PUT(put({ appId: 620, targetPriceCents: null }));
    expect(getUserWishlist(userId)[0].targetPriceCents).toBeUndefined();
  });

  it("rejects a price that is not a positive whole number of cents, or bad JSON", async () => {
    signIn();

    expect((await PUT(put({ appId: 620, targetPriceCents: -1 }))).status).toBe(400);
    expect((await PUT(put({ appId: 620, targetPriceCents: 9.5 }))).status).toBe(400);
    expect((await PUT(put({ targetPriceCents: 100 }))).status).toBe(400);
    expect((await PUT(put("{oops"))).status).toBe(400);
  });

  it("answers 404 for a game outside the wishlist", async () => {
    signIn();

    expect((await PUT(put({ appId: 1, targetPriceCents: 100 }))).status).toBe(404);
  });
});
