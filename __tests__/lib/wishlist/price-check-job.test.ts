// __tests__/lib/wishlist/price-check-job.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, setGameWishlist, getUserWishlist } from "@/lib/db";
import { checkWishlistPrices } from "@/lib/wishlist/price-check-job";

const NOW = new Date("2026-11-11T12:00:00.000Z");

describe("checkWishlistPrices", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    userId = createUser("Watcher", "password123").id;
    setGameWishlist(userId, 620, "steam", true, { name: "Portal 2" });
    setGameWishlist(userId, 5, "xbox", true, { name: "Halo" });
  });

  afterEach(() => setDbForTesting(null));

  it("asks the stores for the due wishes and records their prices", async () => {
    const fetchPrice = vi.fn().mockResolvedValue({ cents: 499, currency: "EUR" });

    expect(await checkWishlistPrices(NOW, fetchPrice)).toBe(1);

    expect(fetchPrice).toHaveBeenCalledWith("steam", 620);
    expect(getUserWishlist(userId).find((w) => w.appId === 620)).toMatchObject({ lastPriceCents: 499, priceCheckedAt: NOW.toISOString() });
  });

  it("does not ask again the same day", async () => {
    const fetchPrice = vi.fn().mockResolvedValue(null);
    await checkWishlistPrices(NOW, fetchPrice);

    expect(await checkWishlistPrices(new Date(NOW.getTime() + 3_600_000), fetchPrice)).toBe(0);
    expect(fetchPrice).toHaveBeenCalledTimes(1);
  });
});
