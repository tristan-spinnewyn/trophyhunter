// __tests__/storage/preferences.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  getFavoriteGames,
  toggleFavoriteGame,
  getRecentGames,
  addRecentGame,
  getLocalWishlist,
  toggleLocalWishlist,
  normalizeGameTitle,
} from "@/lib/storage";

describe("Storage Preferences & Normalization", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("toggles favorite games and limits recent games to 10", () => {
    expect(getFavoriteGames()).toEqual([]);
    expect(toggleFavoriteGame(1091500)).toContain(1091500);
    expect(toggleFavoriteGame(1091500)).not.toContain(1091500);

    for (let i = 1; i <= 15; i++) {
      addRecentGame(i);
    }
    const recents = getRecentGames();
    expect(recents.length).toBe(10);
    expect(recents[0]).toBe(15);
  });

  it("handles local wishlist toggle and title normalization", () => {
    expect(getLocalWishlist()).toEqual([]);
    expect(toggleLocalWishlist(100)).toBe(true);
    expect(getLocalWishlist()).toEqual([100]);
    expect(toggleLocalWishlist(100)).toBe(false);
    expect(getLocalWishlist()).toEqual([]);

    expect(normalizeGameTitle("The Witcher 3: Wild Hunt - Game of the Year Edition")).toBe("thewitcher3wildhunt");
    expect(normalizeGameTitle("Cyberpunk 2077 (Remastered)")).toBe("cyberpunk2077");
  });
});
