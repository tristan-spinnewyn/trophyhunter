// __tests__/api/user/wishlist_duplicates.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession, saveUserOwnedGames } from "@/lib/db";
import { GET as getDuplicates } from "@/app/api/user/duplicates/route";
import { GET as getWishlist, POST as toggleWishlist } from "@/app/api/user/wishlist/route";
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

describe("User Wishlist & Duplicates API", () => {
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

  it("returns cross-platform duplicate games", async () => {
    const dupData = await (await getDuplicates()).json();
    expect(dupData.duplicates.length).toBe(1);
    expect(dupData.duplicates[0].games.some((g: OwnedGame) => g.platform === "steam")).toBe(true);
    expect(dupData.duplicates[0].games.some((g: OwnedGame) => g.platform === "xbox")).toBe(true);
  });
});
