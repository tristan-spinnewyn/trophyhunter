// __tests__/api/profile/gog.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/profile/gog/route";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  getUserOwnedGames,
  getUserPlatformAccounts,
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
    delete: (name: string) => {
      mockCookieStore.delete(name);
    },
  }),
}));

describe("GET /api/profile/gog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
  });

  it("returns 400 when user parameter is missing", async () => {
    const res = await GET(new Request("http://localhost:3000/api/profile/gog"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Paramètre 'user' (pseudo GOG) requis");
  });

  it("scrapes public GOG profile for avatar and game count", async () => {
    const mockHtml = `
      <div class="user-avatar-container"><img class="user-avatar" src="https://images.gog.com/avatar.jpg" /></div>
      <div class="user-stats__item-count">42</div>
    `;
    vi.spyOn(global, "fetch").mockResolvedValueOnce(textResponse(mockHtml));

    const res = await GET(new Request("http://localhost:3000/api/profile/gog?user=GwentMaster"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.platform).toBe("gog");
    expect(data.account.stats.gamesOwned).toBe(42);
  });

  it("synchronizes full GOG URL with window.profilesData and public games/stats", async () => {
    const mockProfileHtml = `
      <script>
        window.profilesData.profileUser = {"username":"shinkuma13","userId":"50793782277245151","avatar":"https:\\/\\/images.gog.com\\/dc04.jpg","stats":{"games_owned":"33","achievements":15,"hours_played":8}};
      </script>
    `;
    const mockStatsJson = {
      page: 1,
      pages: 1,
      total: 1,
      _embedded: {
        items: [
          {
            game: {
              id: "1436434037",
              title: "Metro 2033 Redux",
              achievementSupport: false,
              image: "https://images.gog-statics.com/metro.png",
            },
            stats: [],
          },
        ],
      },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(textResponse(mockProfileHtml))
      .mockResolvedValueOnce(jsonResponse(mockStatsJson));

    const res = await GET(
      new Request(
        "http://localhost:3000/api/profile/gog?user=" +
          encodeURIComponent("https://www.gog.com/u/shinkuma13")
      )
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.account.username).toBe("shinkuma13");
    expect(data.account.stats.gamesOwned).toBe(33);
    expect(data.account.stats.totalAchievements).toBe(15);
    expect(data.discoveredGames).toHaveLength(1);
    expect(data.discoveredGames[0].name).toBe("Metro 2033 Redux");
  });

  it("fetches owned games when GOG token is provided and persists to database", async () => {
    const user = createUser("GogAuthUser", "password123");
    const sessionId = createSession(user.id);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });

    const mockHtml = `<img class="avatar" src="//images.gog.com/avatar2.jpg" />`;
    const mockLibrary = { owned: [1001, 1002] };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(textResponse(mockHtml))
      .mockResolvedValueOnce(jsonResponse(mockLibrary));

    const res = await GET(new Request("http://localhost:3000/api/profile/gog?user=GogMaster&token=valid-token"));
    expect(res.status).toBe(200);

    const accounts = getUserPlatformAccounts(user.id);
    expect(accounts.gog?.username).toBe("GogMaster");
    expect(getUserOwnedGames(user.id)).toHaveLength(2);
  });
});
