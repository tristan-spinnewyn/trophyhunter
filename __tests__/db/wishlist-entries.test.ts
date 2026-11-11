// __tests__/db/wishlist-entries.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserOwnedGames,
  setGameWishlist,
  getUserWishlist,
  syncFromLocalStorage,
} from "@/lib/db";
import { runDatabaseMigrations } from "@/lib/db/migrations";
import { makeOwnedGame } from "../helpers/gameFixtures";

describe("wishlist of games not owned yet", () => {
  let db: DatabaseSync;
  let userId: string;

  beforeEach(() => {
    db = initDatabase(":memory:");
    setDbForTesting(db);
    userId = createUser("Wisher", "password123").id;
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("keeps a game that is not in the collection, with its name and cover", () => {
    setGameWishlist(userId, 1234, "xbox", true, { name: "Starfield", headerImg: "https://example.com/sf.jpg" });

    expect(getUserWishlist(userId)).toEqual([
      expect.objectContaining({ appId: 1234, platform: "xbox", name: "Starfield", headerImg: "https://example.com/sf.jpg" }),
    ]);
  });

  it("takes the name of a game already in the collection when none is given", () => {
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 600, name: "Half-Life 2" })]);

    setGameWishlist(userId, 600, "steam", true);

    expect(getUserWishlist(userId)[0].name).toBe("Half-Life 2");
  });

  it("lists a game once even when it is wished for twice, and forgets it on any platform when removed", () => {
    setGameWishlist(userId, 1234, "xbox", true, { name: "Starfield" });
    setGameWishlist(userId, 1234, "xbox", true, { name: "Starfield" });
    expect(getUserWishlist(userId)).toHaveLength(1);

    setGameWishlist(userId, 1234, "steam", false);
    expect(getUserWishlist(userId)).toEqual([]);
  });

  it("keeps the wishlist when the game is later imported by a sync", () => {
    setGameWishlist(userId, 1234, "xbox", true, { name: "Starfield" });

    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 1234, name: "Starfield", platform: "xbox" })]);

    expect(getUserWishlist(userId).map((g) => g.appId)).toEqual([1234]);
  });

  it("restores the wishlist sent by a device, using the collection to name the games", () => {
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 600, name: "Half-Life 2", platform: "gog" })]);

    syncFromLocalStorage(userId, { wishlist: [600, 777] });

    expect(getUserWishlist(userId).map((g) => [g.appId, g.platform, g.name]).sort()).toEqual([
      [600, "gog", "Half-Life 2"],
      [777, "steam", "Game 777"],
    ]);
  });

  it("moves the games flagged in an older database into the wishlist, once", () => {
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 600, name: "Half-Life 2" })]);
    db.exec("UPDATE user_games SET is_wishlist = 1 WHERE app_id = 600;");
    db.exec("PRAGMA user_version = 1;");

    runDatabaseMigrations(db);
    setGameWishlist(userId, 600, "steam", false);
    runDatabaseMigrations(db);

    expect(getUserWishlist(userId)).toEqual([]);
  });

  it("moves a flagged game of an older database into the wishlist", () => {
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 600, name: "Half-Life 2" })]);
    db.exec("UPDATE user_games SET is_wishlist = 1 WHERE app_id = 600;");
    db.exec("PRAGMA user_version = 1;");

    runDatabaseMigrations(db);

    expect(getUserWishlist(userId).map((g) => g.name)).toEqual(["Half-Life 2"]);
  });
});
