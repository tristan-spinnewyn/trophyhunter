// __tests__/api/user/game_series.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { CookieRecord } from "../../helpers/cookies";

const { mockCookieStore, getSeriesForGame } = vi.hoisted(() => ({
  mockCookieStore: new Map<string, CookieRecord>(),
  getSeriesForGame: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string) => { mockCookieStore.set(name, { name, value }); },
    delete: (name: string) => { mockCookieStore.delete(name); },
  }),
}));
vi.mock("@/lib/series/game-series.services", () => ({ getSeriesForGame }));

import { initDatabase, setDbForTesting, createUser, createSession } from "@/lib/db";
import { GET } from "@/app/api/user/game-series/route";

const ask = (query: string) => GET(new Request(`http://localhost/api/user/game-series${query}`));

describe("GET /api/user/game-series", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    getSeriesForGame.mockReset();
    userId = createUser("SeriesRoute", "password123").id;
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(userId) });
  });

  it("answers with the series of the asked game", async () => {
    getSeriesForGame.mockResolvedValue({ name: "Portal" });

    const res = await ask("?platform=steam&appId=620");

    expect(await res.json()).toEqual({ series: { name: "Portal" } });
    expect(getSeriesForGame).toHaveBeenCalledWith(userId, { platform: "steam", appId: 620 }, expect.any(Date));
  });

  it("shows no series when IGDB fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getSeriesForGame.mockRejectedValue(new Error("IGDB down"));

    expect(await (await ask("?platform=steam&appId=620")).json()).toEqual({ series: null });
  });

  it("rejects a malformed game and refuses a visitor", async () => {
    expect((await ask("?platform=atari&appId=1")).status).toBe(400);
    expect((await ask("?platform=steam")).status).toBe(400);

    mockCookieStore.clear();
    expect((await ask("?platform=steam&appId=620")).status).toBe(401);
  });
});
