// __tests__/lib/library/acquired-wishlist-games.test.ts
import { describe, it, expect } from "vitest";
import { findAcquiredWishlistGames } from "@/lib/library/acquired-wishlist-games";
import { makeOwnedGame } from "../../helpers/gameFixtures";

describe("findAcquiredWishlistGames", () => {
  it("finds wished-for games that a sync brought into the collection, still waiting to be sorted", () => {
    const bought = makeOwnedGame({ appId: 1, name: "Starfield", status: "unsorted" });
    const legacy = makeOwnedGame({ appId: 2, name: "Tunic", status: undefined });

    expect(findAcquiredWishlistGames([bought, legacy], [1, 2])).toEqual([bought, legacy]);
  });

  it("leaves out games already given a status, and games nobody wished for", () => {
    const queued = makeOwnedGame({ appId: 1, status: "backlog" });
    const playing = makeOwnedGame({ appId: 2, status: "in-progress" });
    const unwished = makeOwnedGame({ appId: 3, status: "unsorted" });

    expect(findAcquiredWishlistGames([queued, playing, unwished], [1, 2])).toEqual([]);
  });
});
