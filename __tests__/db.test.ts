import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  authenticateUser,
  createSession,
  validateSession,
  deleteSession,
  getUserById,
  getUserPlatformAccounts,
  saveUserPlatformAccount,
  getUserPlatformApiKey,
  removeUserPlatformAccount,
  getUserOwnedGames,
  saveUserOwnedGames,
  removeUserPlatformGames,
  getUserGameProgress,
  saveUserGameProgress,
  getAllUserGameProgress,
  getUserCollections,
  createCollection,
  deleteCollection,
  addGameToCollection,
  removeGameFromCollection,
  getCollectionGames,
  setGameWishlist,
  setGameFavorite,
  getUserWishlist,
  getUserDuplicateGames,
  normalizeGameTitle,
  syncFromLocalStorage,
} from "../lib/db";
import type { PlatformAccount, OwnedGame } from "../lib/types";

describe("lib/db (SQLite layer)", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = initDatabase(":memory:");
    setDbForTesting(db);
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  describe("Users & Sessions", () => {
    it("creates and authenticates a user", () => {
      const user = createUser("Tristan", "securePassword123", "Tristan S.");
      expect(user.id).toBeDefined();
      expect(user.username).toBe("tristan");
      expect(user.displayName).toBe("Tristan S.");

      const authSuccess = authenticateUser("Tristan", "securePassword123");
      expect(authSuccess).not.toBeNull();
      expect(authSuccess?.id).toBe(user.id);

      const authFailPass = authenticateUser("tristan", "wrongpass");
      expect(authFailPass).toBeNull();

      const authFailUser = authenticateUser("nonexistent", "securePassword123");
      expect(authFailUser).toBeNull();
    });

    it("prevents short usernames and short passwords", () => {
      expect(() => createUser("ab", "password123")).toThrow("Username must be at least 3 characters");
      expect(() => createUser("validUser", "12345")).toThrow("Password must be at least 6 characters");
    });

    it("prevents duplicate usernames", () => {
      createUser("GamerOne", "password123");
      expect(() => createUser("gamerone", "password123")).toThrow("Username already taken");
    });

    it("manages user sessions with expiration and deletion", () => {
      const user = createUser("SessionUser", "password123");
      const sessionId = createSession(user.id);
      expect(sessionId).toBeDefined();

      const sessionUser = validateSession(sessionId);
      expect(sessionUser).not.toBeNull();
      expect(sessionUser?.id).toBe(user.id);

      const byId = getUserById(user.id);
      expect(byId?.username).toBe("sessionuser");

      deleteSession(sessionId);
      expect(validateSession(sessionId)).toBeNull();
      expect(validateSession("")).toBeNull();
      expect(validateSession("nonexistent-token")).toBeNull();
    });
  });

  describe("Platform Accounts & Encrypted Keys", () => {
    it("saves and retrieves platform accounts with encrypted API keys", () => {
      const user = createUser("KeyUser", "password123");
      const account: PlatformAccount = {
        platform: "steam",
        username: "76561198083390097",
        displayName: "MySteamProfile",
        avatarUrl: "https://example.com/avatar.jpg",
        connectedAt: new Date().toISOString(),
        stats: {
          gamesOwned: 10,
          totalAchievements: 250,
          completedGames: 2,
        },
      };

      saveUserPlatformAccount(user.id, account, "SECRET_STEAM_API_KEY_123");

      const accounts = getUserPlatformAccounts(user.id);
      expect(accounts.steam).toBeDefined();
      expect(accounts.steam?.displayName).toBe("MySteamProfile");
      expect(accounts.steam?.stats.gamesOwned).toBe(10);

      const decryptedKey = getUserPlatformApiKey(user.id, "steam");
      expect(decryptedKey).toBe("SECRET_STEAM_API_KEY_123");

      removeUserPlatformAccount(user.id, "steam");
      const afterRemove = getUserPlatformAccounts(user.id);
      expect(afterRemove.steam).toBeUndefined();
      expect(getUserPlatformApiKey(user.id, "steam")).toBeNull();
    });
  });

  describe("Owned Games & Progress", () => {
    it("saves, retrieves, updates and deletes owned games", () => {
      const user = createUser("GamesUser", "password123");
      const games: OwnedGame[] = [
        {
          appId: 10,
          name: "Counter-Strike",
          headerImg: "https://example.com/cs.jpg",
          platform: "steam",
          totalAchievements: 0,
          unlockedCount: 0,
          playtimeHours: 50,
          addedAt: new Date().toISOString(),
        },
        {
          appId: 20,
          name: "Team Fortress Classic",
          headerImg: "https://example.com/tfc.jpg",
          platform: "steam",
          totalAchievements: 10,
          unlockedCount: 5,
          playtimeHours: 20,
          addedAt: new Date().toISOString(),
        },
      ];

      saveUserOwnedGames(user.id, games);

      const retrieved = getUserOwnedGames(user.id);
      expect(retrieved.length).toBe(2);
      expect(retrieved.some((g) => g.name === "Counter-Strike")).toBe(true);

      removeUserPlatformGames(user.id, "steam");
      expect(getUserOwnedGames(user.id).length).toBe(0);
    });

    it("saves and retrieves game progress", () => {
      const user = createUser("ProgressUser", "password123");
      saveUserGameProgress(user.id, 400, "steam", {
        unlockedIds: ["ACH_1", "ACH_2"],
        notes: { ACH_1: "Found in secret room" },
      });

      const prog = getUserGameProgress(user.id, 400, "steam");
      expect(prog).not.toBeNull();
      expect(prog?.unlockedIds).toEqual(["ACH_1", "ACH_2"]);
      expect(prog?.notes.ACH_1).toBe("Found in secret room");

      const allProg = getAllUserGameProgress(user.id);
      expect(allProg["steam_400"]).toBeDefined();
    });
  });

  describe("Collections, Wishlist & Duplicates", () => {
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

    it("detects cross-platform duplicate games", () => {
      const user = createUser("DupUser", "password123");
      const games: OwnedGame[] = [
        {
          appId: 292030,
          name: "The Witcher 3: Wild Hunt - Game of the Year Edition",
          headerImg: "https://example.com/w3.jpg",
          platform: "steam",
          totalAchievements: 78,
          unlockedCount: 50,
          addedAt: new Date().toISOString(),
        },
        {
          appId: 10001,
          name: "The Witcher 3: Wild Hunt (GOTY Edition)",
          headerImg: "https://example.com/w3-gog.jpg",
          platform: "gog",
          totalAchievements: 78,
          unlockedCount: 10,
          addedAt: new Date().toISOString(),
        },
        {
          appId: 70,
          name: "Half-Life",
          headerImg: "https://example.com/hl.jpg",
          platform: "steam",
          totalAchievements: 0,
          unlockedCount: 0,
          addedAt: new Date().toISOString(),
        },
      ];
      saveUserOwnedGames(user.id, games);

      const duplicates = getUserDuplicateGames(user.id);
      expect(duplicates.length).toBe(1);
      expect(duplicates[0].games.length).toBe(2);
      expect(duplicates[0].games.some((g) => g.platform === "steam")).toBe(true);
      expect(duplicates[0].games.some((g) => g.platform === "gog")).toBe(true);
    });
  });

  describe("LocalStorage Migration", () => {
    it("migrates localStorage payload into user account", () => {
      const user = createUser("MigrateUser", "password123");
      syncFromLocalStorage(user.id, {
        profile: {
          displayName: "Old Local Profile",
          accounts: {
            steam: {
              platform: "steam",
              username: "76561198083390097",
              displayName: "OldSteam",
              connectedAt: new Date().toISOString(),
              stats: {
                gamesOwned: 5,
                totalAchievements: 100,
                completedGames: 1,
              },
            },
          },
        },
        steamApiKey: "OLD_LOCAL_STEAM_API_KEY",
        games: [
          {
            appId: 1234,
            name: "Synced Local Game",
            headerImg: "",
            platform: "steam",
            totalAchievements: 10,
            unlockedCount: 2,
            addedAt: new Date().toISOString(),
          },
        ],
        progress: {
          trophyhunter_game_1234: {
            unlockedIds: ["ACH_OLD"],
            notes: { ACH_OLD: "Imported from local" },
          },
        },
      });

      const accounts = getUserPlatformAccounts(user.id);
      expect(accounts.steam?.displayName).toBe("OldSteam");
      expect(getUserPlatformApiKey(user.id, "steam")).toBe("OLD_LOCAL_STEAM_API_KEY");

      const games = getUserOwnedGames(user.id);
      expect(games.length).toBe(1);
      expect(games[0].name).toBe("Synced Local Game");

      const prog = getUserGameProgress(user.id, 1234, "steam");
      expect(prog?.unlockedIds).toEqual(["ACH_OLD"]);
    });
  });
});
