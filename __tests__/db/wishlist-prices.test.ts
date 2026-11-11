// __tests__/db/wishlist-prices.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  setGameWishlist,
  getUserWishlist,
  setWishlistTargetPrice,
  recordWishlistPrice,
  listWishlistPriceChecksDue,
} from "@/lib/db";
import { runDatabaseMigrations } from "@/lib/db/migrations";

const NOW = new Date("2026-11-11T12:00:00.000Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000);

describe("wishlist prices", () => {
  let db: DatabaseSync;
  let userId: string;

  beforeEach(() => {
    db = initDatabase(":memory:");
    setDbForTesting(db);
    userId = createUser("Bargain", "password123").id;
    setGameWishlist(userId, 620, "steam", true, { name: "Portal 2" });
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("has no price nor target at first", () => {
    expect(getUserWishlist(userId)[0]).toMatchObject({ appId: 620, targetPriceCents: undefined, lastPriceCents: undefined });
  });

  it("stores the price the owner waits for, and clears it", () => {
    expect(setWishlistTargetPrice(userId, 620, 999)).toBe(true);
    expect(getUserWishlist(userId)[0].targetPriceCents).toBe(999);

    setWishlistTargetPrice(userId, 620, null);
    expect(getUserWishlist(userId)[0].targetPriceCents).toBeUndefined();
  });

  it("reports a game outside the wishlist", () => {
    expect(setWishlistTargetPrice(userId, 1, 500)).toBe(false);
  });

  it("records the price a store gave, and when it was asked", () => {
    recordWishlistPrice(userId, 620, { cents: 499, currency: "EUR" }, NOW);

    expect(getUserWishlist(userId)[0]).toMatchObject({ lastPriceCents: 499, currency: "EUR", priceCheckedAt: NOW.toISOString() });
  });

  it("keeps the last price when a store does not answer, but dates the attempt", () => {
    recordWishlistPrice(userId, 620, { cents: 499, currency: "EUR" }, hoursAgo(30));
    recordWishlistPrice(userId, 620, null, NOW);

    expect(getUserWishlist(userId)[0]).toMatchObject({ lastPriceCents: 499, priceCheckedAt: NOW.toISOString() });
  });

  it("lists the Steam and GOG wishes not checked for a day, never checked first", () => {
    setGameWishlist(userId, 2, "gog", true, { name: "Gwent" });
    setGameWishlist(userId, 3, "xbox", true, { name: "Halo" });
    setGameWishlist(userId, 4, "steam", true, { name: "Fresh" });
    recordWishlistPrice(userId, 620, null, hoursAgo(30));
    recordWishlistPrice(userId, 4, null, hoursAgo(2));

    expect(listWishlistPriceChecksDue(NOW, 10)).toEqual([
      { userId, appId: 2, platform: "gog" },
      { userId, appId: 620, platform: "steam" },
    ]);
    expect(listWishlistPriceChecksDue(NOW, 1)).toHaveLength(1);
  });

  it("adds the price columns to an older database", () => {
    for (const column of ["target_price_cents", "last_price_cents", "currency", "price_checked_at"]) {
      db.exec(`ALTER TABLE user_wishlist DROP COLUMN ${column};`);
    }

    runDatabaseMigrations(db);

    expect(setWishlistTargetPrice(userId, 620, 100)).toBe(true);
  });
});
