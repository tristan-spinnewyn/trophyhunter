import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  saveUserOwnedGames,
} from "@/lib/db";
import { GET as getCollections, POST as createCollectionHandler } from "@/app/api/collections/route";
import { DELETE as deleteCollectionHandler } from "@/app/api/collections/[id]/route";
import {
  GET as getCollGames,
  POST as addCollGame,
  DELETE as removeCollGame,
} from "@/app/api/collections/[id]/games/route";
import { GET as getDuplicates } from "@/app/api/user/duplicates/route";
import {
  GET as getWishlist,
  POST as toggleWishlist,
} from "@/app/api/user/wishlist/route";
import type { OwnedGame } from "@/lib/types";

const mockCookieStore = new Map<string, any>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string, options: any) => {
      mockCookieStore.set(name, { name, value, ...options });
    },
    delete: (name: string) => {
      mockCookieStore.delete(name);
    },
  }),
}));

describe("Collections, Wishlist & Duplicates API Routes", () => {
  let userId: string;

  beforeEach(() => {
    const db = initDatabase(":memory:");
    setDbForTesting(db);
    mockCookieStore.clear();

    const user = createUser("CollectionTester", "password123");
    userId = user.id;
    const sessionId = createSession(userId);
    mockCookieStore.set("trophyhunter_session", { value: sessionId });

    const games: OwnedGame[] = [
      {
        appId: 100,
        name: "Elden Ring",
        headerImg: "https://example.com/er.jpg",
        platform: "steam",
        totalAchievements: 42,
        unlockedCount: 42,
        addedAt: new Date().toISOString(),
      },
      {
        appId: 200,
        name: "Elden Ring",
        headerImg: "https://example.com/er-xbox.jpg",
        platform: "xbox",
        totalAchievements: 42,
        unlockedCount: 10,
        addedAt: new Date().toISOString(),
      },
    ];
    saveUserOwnedGames(userId, games);
  });

  describe("Collections CRUD", () => {
    it("creates, retrieves, and deletes collections", async () => {
      const createReq = new Request("http://localhost/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "RPG Chefs-d'œuvre",
          description: "Mes RPG préférés",
          color: "#6366f1",
          icon: "sword",
        }),
      });

      const createRes = await createCollectionHandler(createReq);
      expect(createRes.status).toBe(201);
      const { collection } = await createRes.json();
      expect(collection.name).toBe("RPG Chefs-d'œuvre");

      const listRes = await getCollections();
      const listData = await listRes.json();
      expect(listData.collections.length).toBe(1);
      expect(listData.collections[0].name).toBe("RPG Chefs-d'œuvre");

      const delRes = await deleteCollectionHandler(
        new Request("http://localhost/api/collections/" + collection.id),
        { params: Promise.resolve({ id: collection.id }) }
      );
      expect(delRes.status).toBe(200);

      const afterDel = await (await getCollections()).json();
      expect(afterDel.collections.length).toBe(0);
    });

    it("adds and removes games from collections", async () => {
      const createReq = new Request("http://localhost/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Backlog" }),
      });
      const { collection } = await (await createCollectionHandler(createReq)).json();

      const addReq = new Request(`http://localhost/api/collections/${collection.id}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: 100, platform: "steam" }),
      });
      const addRes = await addCollGame(addReq, { params: Promise.resolve({ id: collection.id }) });
      expect(addRes.status).toBe(200);

      const getGamesRes = await getCollGames(
        new Request(`http://localhost/api/collections/${collection.id}/games`),
        { params: Promise.resolve({ id: collection.id }) }
      );
      const getGamesData = await getGamesRes.json();
      expect(getGamesData.games.length).toBe(1);
      expect(getGamesData.games[0].name).toBe("Elden Ring");

      const removeReq = new Request(
        `http://localhost/api/collections/${collection.id}/games?appId=100&platform=steam`,
        { method: "DELETE" }
      );
      const removeRes = await removeCollGame(removeReq, { params: Promise.resolve({ id: collection.id }) });
      expect(removeRes.status).toBe(200);

      const afterRemove = await (
        await getCollGames(
          new Request(`http://localhost/api/collections/${collection.id}/games`),
          { params: Promise.resolve({ id: collection.id }) }
        )
      ).json();
      expect(afterRemove.games.length).toBe(0);
    });
  });

  describe("Wishlist API", () => {
    it("toggles and retrieves wishlist games", async () => {
      const toggleReq = new Request("http://localhost/api/user/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: 100, platform: "steam", isWishlist: true }),
      });

      const toggleRes = await toggleWishlist(toggleReq);
      expect(toggleRes.status).toBe(200);

      const getRes = await getWishlist();
      const getData = await getRes.json();
      expect(getData.wishlist.length).toBe(1);
      expect(getData.wishlist[0].appId).toBe(100);

      // Untoggle
      const untoggleReq = new Request("http://localhost/api/user/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: 100, platform: "steam", isWishlist: false }),
      });
      await toggleWishlist(untoggleReq);

      const emptyRes = await (await getWishlist()).json();
      expect(emptyRes.wishlist.length).toBe(0);
    });
  });

  describe("Duplicates API", () => {
    it("returns cross-platform duplicate games", async () => {
      const res = await getDuplicates();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.duplicates.length).toBe(1);
      expect(data.duplicates[0].games.length).toBe(2);
      expect(data.duplicates[0].games.some((g: any) => g.platform === "steam")).toBe(true);
      expect(data.duplicates[0].games.some((g: any) => g.platform === "xbox")).toBe(true);
    });
  });
});
