// __tests__/api/profile/steam_api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/profile/steam/route";
import { initDatabase, setDbForTesting } from "@/lib/db";
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

describe("GET /api/profile/steam WebAPI Key Flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
  });

  it("imports complete owned games list when Steam API key is provided", async () => {
    const mockXml = `<profile><steamID64>76561198000000000</steamID64><steamID>TestGamer</steamID></profile>`;
    const mockHtml = `<div class="actual_persona_name">TestGamer</div>`;
    const mockOwned = {
      response: {
        game_count: 2,
        games: [
          { appid: 1517290, name: "Battlefield™ 2042", playtime_forever: 360 },
          { appid: 1091500, name: "Cyberpunk 2077", playtime_forever: 1200 },
        ],
      },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(textResponse(mockXml))
      .mockResolvedValueOnce(textResponse(mockHtml))
      .mockResolvedValueOnce(textResponse("", 404))
      .mockResolvedValueOnce(textResponse("", 404))
      .mockResolvedValueOnce(jsonResponse(mockOwned));

    const res = await GET(
      new Request("http://localhost:3000/api/profile/steam?user=76561198000000000&key=MY_KEY")
    );
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.discoveredGames.length).toBe(2);
    expect(data.discoveredGames[0].playtimeHours).toBe(6);
  });
});
