// __tests__/lib/wishlist/release-date-job.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { isIgdbConfigured } = vi.hoisted(() => ({ isIgdbConfigured: vi.fn(() => true) }));
vi.mock("@/lib/igdb/igdb-client", () => ({ isIgdbConfigured, igdbQuery: vi.fn() }));

import { initDatabase, setDbForTesting, createUser, setGameWishlist, getUserWishlist } from "@/lib/db";
import { refreshWishlistReleaseDates } from "@/lib/wishlist/release-date-job";

const now = new Date("2027-03-10T12:00:00.000Z");

describe("refreshWishlistReleaseDates", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    userId = createUser("Waiter", "password123").id;
    setGameWishlist(userId, 1, "steam", true, { name: "Hades II" });
    isIgdbConfigured.mockReturnValue(true);
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("looks up the wished games due and stores their release date", async () => {
    const lookup = vi.fn().mockResolvedValue(new Map([["steam_1", { igdbGameId: 9, releaseDate: "2027-04-01T00:00:00.000Z" }]]));

    expect(await refreshWishlistReleaseDates(now, lookup)).toBe(1);

    expect(lookup).toHaveBeenCalledWith([{ appId: 1, platform: "steam", name: "Hades II" }]);
    expect(getUserWishlist(userId)[0].releaseDate).toBe("2027-04-01T00:00:00.000Z");
    expect(await refreshWishlistReleaseDates(now, lookup)).toBe(0);
  });

  it("asks nothing when IGDB keys are not set or nothing is due", async () => {
    const lookup = vi.fn();
    isIgdbConfigured.mockReturnValue(false);

    expect(await refreshWishlistReleaseDates(now, lookup)).toBe(0);
    expect(lookup).not.toHaveBeenCalled();
  });
});
