// __tests__/db/release-dates.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  setGameWishlist,
  getUserWishlist,
  listWishlistReleaseChecksDue,
  saveReleaseDates,
} from "@/lib/db";

const now = new Date("2027-03-10T12:00:00.000Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

describe("wishlist release dates", () => {
  let alice: string;
  let bob: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    alice = createUser("Alice", "password123").id;
    bob = createUser("Bob", "password123").id;
    setGameWishlist(alice, 1, "steam", true, { name: "Hades II" });
    setGameWishlist(bob, 1, "steam", true, { name: "Hades II" });
    setGameWishlist(alice, 2, "gog", true, { name: "Silksong" });
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("asks once per wished game never checked", () => {
    expect(listWishlistReleaseChecksDue(now, 10)).toEqual([
      { appId: 1, platform: "steam", name: "Hades II" },
      { appId: 2, platform: "gog", name: "Silksong" },
    ]);
    expect(listWishlistReleaseChecksDue(now, 1)).toHaveLength(1);
  });

  it("shows the stored date with the wishlist", () => {
    saveReleaseDates(new Map([["steam_1", { igdbGameId: 9, releaseDate: "2027-04-01T00:00:00.000Z" }], ["gog_2", null]]), now);

    expect(getUserWishlist(alice).map((w) => [w.appId, w.releaseDate])).toEqual(
      expect.arrayContaining([[1, "2027-04-01T00:00:00.000Z"], [2, undefined]])
    );
  });

  it("asks again after a week for a coming or unknown release, after three months for a past one", () => {
    saveReleaseDates(new Map([["steam_1", { igdbGameId: 9, releaseDate: "2027-04-01T00:00:00.000Z" }], ["gog_2", null]]), daysAgo(6));
    expect(listWishlistReleaseChecksDue(now, 10)).toEqual([]);

    saveReleaseDates(new Map([["steam_1", { igdbGameId: 9, releaseDate: "2027-04-01T00:00:00.000Z" }], ["gog_2", null]]), daysAgo(8));
    expect(listWishlistReleaseChecksDue(now, 10).map((g) => g.appId)).toEqual([1, 2]);

    saveReleaseDates(new Map([["steam_1", { igdbGameId: 9, releaseDate: "2026-01-01T00:00:00.000Z" }]]), daysAgo(30));
    expect(listWishlistReleaseChecksDue(now, 10).map((g) => g.appId)).toEqual([2]);
  });
});
