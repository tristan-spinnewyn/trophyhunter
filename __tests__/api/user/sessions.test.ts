// __tests__/api/user/sessions.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession, saveUserOwnedGames } from "@/lib/db";
import type { OwnedGame } from "@/lib/types";
import type { CookieRecord } from "../../helpers/cookies";

const { mockCookieStore } = vi.hoisted(() => ({
  mockCookieStore: new Map<string, CookieRecord>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string) => { mockCookieStore.set(name, { name, value }); },
    delete: (name: string) => { mockCookieStore.delete(name); },
  }),
}));

import { GET } from "@/app/api/user/sessions/route";

function game(playtimeHours: number): OwnedGame {
  return {
    appId: 620,
    name: "Portal 2",
    headerImg: "https://example.com/620.jpg",
    platform: "steam",
    totalAchievements: 0,
    unlockedCount: 0,
    playtimeHours,
    addedAt: "2026-01-01T00:00:00.000Z",
  };
}

function sessionsRequest(query = ""): Request {
  return new Request(`http://localhost:3000/api/user/sessions${query}`);
}

describe("GET /api/user/sessions", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    userId = createUser("SessionsUser", "password123").id;
    saveUserOwnedGames(userId, [game(1)]);
    saveUserOwnedGames(userId, [game(3)]);
  });

  it("refuses an anonymous caller", async () => {
    const res = await GET(sessionsRequest());

    expect(res.status).toBe(401);
  });

  it("returns the signed-in user's sessions", async () => {
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(userId) });

    const res = await GET(sessionsRequest());

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0]).toMatchObject({ appId: 620, name: "Portal 2", minutes: 120 });
  });

  it("only returns sessions since the given date", async () => {
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(userId) });

    const res = await GET(sessionsRequest("?since=2999-01-01T00:00:00.000Z"));

    expect((await res.json()).sessions).toEqual([]);
  });

  it("rejects a since value that is not a date", async () => {
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(userId) });

    const res = await GET(sessionsRequest("?since=yesterday"));

    expect(res.status).toBe(400);
  });
});
