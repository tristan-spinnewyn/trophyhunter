// __tests__/api/profile/steam_stored_key.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/profile/steam/route";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  saveUserPlatformAccount,
  getUserOwnedGames,
} from "@/lib/db";
import type { CookieRecord } from "../../helpers/cookies";
import { jsonResponse, textResponse } from "../../helpers/responses";

const { mockCookieStore } = vi.hoisted(() => ({
  mockCookieStore: new Map<string, CookieRecord>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string, options?: Omit<CookieRecord, "name" | "value">) => {
      mockCookieStore.set(name, { name, value, ...options });
    },
    delete: (name: string) => { mockCookieStore.delete(name); },
  }),
}));

describe("GET /api/profile/steam Stored Key Flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
  });

  it("resolves encrypted key and persists games to SQLite for authenticated user", async () => {
    const user = createUser("SteamUserAuth", "password123");
    const sessionId = createSession(user.id);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });

    saveUserPlatformAccount(
      user.id,
      {
        platform: "steam",
        username: "76561198000000000",
        displayName: "SteamUserAuth",
        connectedAt: new Date().toISOString(),
        stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 },
      },
      "STORED_SECRET_KEY"
    );

    const mockXml = `<profile><steamID64>76561198000000000</steamID64><steamID>TestGamer</steamID></profile>`;
    const mockHtml = `<div class="actual_persona_name">TestGamer</div>`;
    const mockOwned = {
      response: { game_count: 1, games: [{ appid: 42, name: "Stored Game", playtime_forever: 120 }] },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(textResponse(mockXml))
      .mockResolvedValueOnce(textResponse(mockHtml))
      .mockResolvedValueOnce(textResponse("", 404))
      .mockResolvedValueOnce(textResponse("", 404))
      .mockResolvedValueOnce(jsonResponse(mockOwned));

    const res = await GET(new Request("http://localhost:3000/api/profile/steam?user=76561198000000000"));
    expect(res.status).toBe(200);

    const savedGames = getUserOwnedGames(user.id);
    expect(savedGames.length).toBe(1);
    expect(savedGames[0].name).toBe("Stored Game");
  });
});
