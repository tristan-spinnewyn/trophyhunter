// __tests__/db/wishlist.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserOwnedGames,
  setGameWishlist,
  setGameFavorite,
  getUserWishlist,
} from "@/lib/db";
import type { OwnedGame } from "@/lib/types";

describe("Database Wishlist & Favorites", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("manages wishlist and favorites", () => {
    const user = createUser("WishlistUser", "password123");
    const game: OwnedGame = {
      appId: 600,
      name: "Half-Life 2",
      headerImg: "https://example.com/hl2.jpg",
      platform: "steam",
      totalAchievements: 33,
      unlockedCount: 20,
      addedAt: new Date().toISOString(),
    };
    saveUserOwnedGames(user.id, [game]);

    setGameWishlist(user.id, 600, "steam", true);
    setGameFavorite(user.id, 600, "steam", true);

    const wishlist = getUserWishlist(user.id);
    expect(wishlist.length).toBe(1);
    expect(wishlist[0].appId).toBe(600);

    setGameWishlist(user.id, 600, "steam", false);
    expect(getUserWishlist(user.id).length).toBe(0);
  });
});
