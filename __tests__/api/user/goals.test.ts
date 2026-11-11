// __tests__/api/user/goals.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession, saveUserOwnedGames } from "@/lib/db";
import { GET, PUT, DELETE } from "@/app/api/user/goals/route";
import { makeOwnedGame } from "../../helpers/gameFixtures";
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

const request = (method: string, body?: unknown, query = "") =>
  new Request(`http://localhost/api/user/goals${query}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });

describe("/api/user/goals", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2027-07-02T12:00:00.000Z"));
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    const userId = createUser("GoalRoute", "password123").id;
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(userId) });
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 1, status: "completed", completedAt: "2027-02-01T00:00:00.000Z" })]);
  });

  afterEach(() => {
    vi.useRealTimers();
    setDbForTesting(null);
  });

  it("sets a goal and answers with the year's goals and their progress", async () => {
    const res = await PUT(request("PUT", { year: 2027, kind: "games-finished", target: 4 }));

    expect(res.status).toBe(200);
    expect((await res.json()).goals).toEqual([
      expect.objectContaining({ year: 2027, kind: "games-finished", target: 4, current: 1, isReached: false }),
    ]);
  });

  it("lists the goals of the asked year, the current one by default", async () => {
    await PUT(request("PUT", { year: 2027, kind: "games-finished", target: 4 }));
    await PUT(request("PUT", { year: 2026, kind: "hours-played", target: 50 }));

    expect((await (await GET(request("GET"))).json()).goals.map((g: { year: number }) => g.year)).toEqual([2027]);
    expect((await (await GET(request("GET", undefined, "?year=2026"))).json()).goals.map((g: { kind: string }) => g.kind)).toEqual(["hours-played"]);
  });

  it("rejects an invalid goal or year", async () => {
    expect((await PUT(request("PUT", { year: 2027, kind: "games-finished", target: -1 }))).status).toBe(400);
    expect((await GET(request("GET", undefined, "?year=abc"))).status).toBe(400);
    expect((await DELETE(request("DELETE", { year: 2027, kind: "x" }))).status).toBe(400);
  });

  it("deletes a goal, and answers 404 for a goal that is not set", async () => {
    await PUT(request("PUT", { year: 2027, kind: "games-finished", target: 4 }));

    const res = await DELETE(request("DELETE", { year: 2027, kind: "games-finished" }));
    expect(res.status).toBe(200);
    expect((await res.json()).goals).toEqual([]);
    expect((await DELETE(request("DELETE", { year: 2027, kind: "games-finished" }))).status).toBe(404);
  });

  it("refuses a visitor", async () => {
    mockCookieStore.clear();

    expect((await GET(request("GET"))).status).toBe(401);
    expect((await PUT(request("PUT", { year: 2027, kind: "games-finished", target: 4 }))).status).toBe(401);
    expect((await DELETE(request("DELETE", { year: 2027, kind: "games-finished" }))).status).toBe(401);
  });
});
