// __tests__/api/profile/xbox_persistence.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/profile/xbox/route";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  saveUserPlatformAccount,
  getUserOwnedGames,
} from "@/lib/db";
import type { CookieRecord } from "../../helpers/cookies";
import { jsonResponse } from "../../helpers/responses";

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

describe("GET /api/profile/xbox Persistence", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
  });

  it("resolves encrypted key and auto-persists to SQLite for authenticated user", async () => {
    const user = createUser("XboxAuthUser", "password123");
    const sessionId = createSession(user.id);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });

    saveUserPlatformAccount(
      user.id,
      {
        platform: "xbox",
        username: "Chief117",
        displayName: "Master Chief",
        connectedAt: new Date().toISOString(),
        stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 },
      },
      "ENCRYPTED_OPENXBL_KEY"
    );

    const mockProfileResponse = {
      profileUsers: [
        {
          id: "117117117",
          settings: [
            { id: "Gamertag", value: "Master Chief" },
            { id: "Gamerscore", value: "50000" },
          ],
        },
      ],
    };

    const mockTitlesResponse = {
      titles: [
        {
          titleId: "555",
          name: "Halo 3",
          displayImage: "halo3.jpg",
          achievement: { currentAchievements: 40, totalAchievements: 40 },
        },
      ],
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(mockProfileResponse))
      .mockResolvedValueOnce(jsonResponse(mockTitlesResponse));

    const res = await GET(new Request("http://localhost:3000/api/profile/xbox?user=Chief117"));
    expect(res.status).toBe(200);

    const savedGames = getUserOwnedGames(user.id);
    expect(savedGames.length).toBe(1);
    expect(savedGames[0].name).toBe("Halo 3");
  });
});
