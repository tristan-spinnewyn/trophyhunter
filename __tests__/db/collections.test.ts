// __tests__/db/collections.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserOwnedGames,
  createCollection,
  getUserCollections,
  getCollectionGames,
  addGameToCollection,
  removeGameFromCollection,
  deleteCollection,
} from "@/lib/db";
import type { OwnedGame } from "@/lib/types";

describe("Database Collections", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("manages collections and collection games", () => {
    const user = createUser("CollectionUser", "password123");
    const game: OwnedGame = {
      appId: 500,
      name: "Portal",
      headerImg: "https://example.com/portal.jpg",
      platform: "steam",
      totalAchievements: 15,
      unlockedCount: 15,
      addedAt: new Date().toISOString(),
    };
    saveUserOwnedGames(user.id, [game]);

    const collection = createCollection(user.id, "Mes Favoris", "Jeux préférés", "#ff0000", "star");
    expect(collection.name).toBe("Mes Favoris");

    addGameToCollection(user.id, collection.id, 500, "steam");

    const collGames = getCollectionGames(user.id, collection.id);
    expect(collGames.length).toBe(1);
    expect(collGames[0].name).toBe("Portal");

    const colls = getUserCollections(user.id);
    expect(colls[0].gameCount).toBe(1);

    removeGameFromCollection(user.id, collection.id, 500, "steam");
    expect(getCollectionGames(user.id, collection.id).length).toBe(0);

    deleteCollection(user.id, collection.id);
    expect(getUserCollections(user.id).length).toBe(0);
  });
});
