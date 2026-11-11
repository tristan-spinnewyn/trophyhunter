// __tests__/db/game-review.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserOwnedGames,
  getUserOwnedGames,
  setUserGameReview,
} from "@/lib/db";
import type { OwnedGame } from "@/lib/types";

const portal: OwnedGame = {
  appId: 620,
  name: "Portal 2",
  headerImg: "",
  platform: "steam",
  totalAchievements: 0,
  unlockedCount: 0,
  addedAt: "2026-01-01T00:00:00.000Z",
  status: "completed",
};

describe("game reviews", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    userId = createUser("ReviewUser", "password123").id;
    saveUserOwnedGames(userId, [portal]);
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("stores a rating and a review and reads them back with the collection", () => {
    expect(setUserGameReview(userId, 620, "steam", { rating: 5, review: "Chef-d'œuvre." })).toBe(true);

    expect(getUserOwnedGames(userId)[0]).toMatchObject({ rating: 5, review: "Chef-d'œuvre." });
  });

  it("clears them", () => {
    setUserGameReview(userId, 620, "steam", { rating: 5, review: "Chef-d'œuvre." });
    setUserGameReview(userId, 620, "steam", { rating: null, review: null });

    const game = getUserOwnedGames(userId)[0];
    expect(game.rating).toBeUndefined();
    expect(game.review).toBeUndefined();
  });

  it("reports a game that is not in the collection", () => {
    expect(setUserGameReview(userId, 999, "steam", { rating: 3, review: null })).toBe(false);
  });

  it("keeps the review when a sync writes the game again", () => {
    setUserGameReview(userId, 620, "steam", { rating: 4, review: "Bien." });

    saveUserOwnedGames(userId, [{ ...portal, playtimeHours: 12 }]);

    expect(getUserOwnedGames(userId)[0]).toMatchObject({ rating: 4, review: "Bien." });
  });

  it("restores the review from a backup", () => {
    saveUserOwnedGames(userId, [{ ...portal, rating: 3, review: "Moyen." }]);

    expect(getUserOwnedGames(userId)[0]).toMatchObject({ rating: 3, review: "Moyen." });
  });
});
