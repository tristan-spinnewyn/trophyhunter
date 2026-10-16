// __tests__/api/user/collections.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession, saveUserOwnedGames } from "@/lib/db";
import { GET as getCollections, POST as createCollectionHandler } from "@/app/api/collections/route";
import { DELETE as deleteCollectionHandler } from "@/app/api/collections/[id]/route";
import {
  GET as getCollGames,
  POST as addCollGame,
  DELETE as removeCollGame,
} from "@/app/api/collections/[id]/games/route";
import type { CookieRecord } from "../../helpers/cookies";

const { mockCookieStore } = vi.hoisted(() => ({
  mockCookieStore: new Map<string, CookieRecord>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string, options?: Omit<CookieRecord, "name" | "value">) => {
      mockCookieStore.set(name, { name, value, ...options });
    },
    delete: (name: string) => {
      mockCookieStore.delete(name);
    },
  }),
}));

describe("User Collections API", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();

    const user = createUser("CollectionTester", "password123");
    const sessionId = createSession(user.id);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });

    saveUserOwnedGames(user.id, [
      {
        appId: 100,
        name: "Elden Ring",
        headerImg: "https://example.com/er.jpg",
        platform: "steam",
        totalAchievements: 42,
        unlockedCount: 42,
        addedAt: new Date().toISOString(),
      },
    ]);
  });

  it("creates, modifies and deletes collections and games", async () => {
    const createRes = await createCollectionHandler(
      new Request("http://localhost/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "RPG", description: "Top RPG", color: "#6366f1", icon: "sword" }),
      })
    );
    expect(createRes.status).toBe(201);
    const { collection } = await createRes.json();

    const addRes = await addCollGame(
      new Request(`http://localhost/api/collections/${collection.id}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: 100, platform: "steam" }),
      }),
      { params: Promise.resolve({ id: collection.id }) }
    );
    expect(addRes.status).toBe(200);

    const getGamesRes = await getCollGames(
      new Request(`http://localhost/api/collections/${collection.id}/games`),
      { params: Promise.resolve({ id: collection.id }) }
    );
    const getGamesData = await getGamesRes.json();
    expect(getGamesData.games.length).toBe(1);

    await removeCollGame(
      new Request(`http://localhost/api/collections/${collection.id}/games?appId=100&platform=steam`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: collection.id }) }
    );
    await deleteCollectionHandler(
      new Request("http://localhost/api/collections/" + collection.id),
      { params: Promise.resolve({ id: collection.id }) }
    );
    expect((await (await getCollections()).json()).collections.length).toBe(0);
  });
});
