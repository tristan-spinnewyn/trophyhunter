// __tests__/api/user/wishlist.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession, saveUserOwnedGames } from "@/lib/db";
import { GET as getWishlist, POST as toggleWishlist } from "@/app/api/user/wishlist/route";
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

describe("User Wishlist API", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();

    const user = createUser("WishlistTester", "password123");
    const sessionId = createSession(user.id);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });

    saveUserOwnedGames(user.id, [
      {
        appId: 100,
        name: "Elden Ring",
        headerImg: "https://example.com/er.jpg",
        platform: "steam",
        totalAchievements: 42,
        unlockedCount: 42,
        addedAt: new Date().toISOString(),
      },
      {
        appId: 200,
        name: "Elden Ring",
        headerImg: "https://example.com/er-xbox.jpg",
        platform: "xbox",
        totalAchievements: 42,
        unlockedCount: 10,
        addedAt: new Date().toISOString(),
      },
    ]);
  });

  it("handles wishlist toggle and retrieval", async () => {
    await toggleWishlist(
      new Request("http://localhost/api/user/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: 100, platform: "steam", isWishlist: true }),
      })
    );
    const wishlistData = await (await getWishlist()).json();
    expect(wishlistData.wishlist.length).toBe(1);
    expect(wishlistData.wishlist[0].appId).toBe(100);
  });

  it("keeps a wished-for game that is not owned, with a safe cover only", async () => {
    const post = (body: unknown) =>
      toggleWishlist(
        new Request("http://localhost/api/user/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );

    await post({ appId: 900, platform: "xbox", isWishlist: true, name: "Starfield", headerImg: "https://example.com/sf.jpg" });
    await post({ appId: 901, platform: "xbox", isWishlist: true, name: "Halo", headerImg: "javascript:alert(1)" });

    const { wishlist } = await (await getWishlist()).json();
    expect(wishlist).toHaveLength(2);
    expect(wishlist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ appId: 900, platform: "xbox", name: "Starfield", headerImg: "https://example.com/sf.jpg" }),
        expect.objectContaining({ appId: 901, name: "Halo", headerImg: "" }),
      ])
    );
  });
});
