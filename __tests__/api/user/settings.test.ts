// __tests__/api/user/settings.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession, getUserSettings } from "@/lib/db";
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

import { GET, PUT } from "@/app/api/user/settings/route";

function putRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/user/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("/api/user/settings", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    userId = createUser("SettingsRouteUser", "password123").id;
  });

  const signIn = () =>
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(userId) });

  it("refuses anonymous callers", async () => {
    expect((await GET()).status).toBe(401);
    expect((await PUT(putRequest({ autoSyncHours: 6 }))).status).toBe(401);
  });

  it("returns the defaults", async () => {
    signIn();

    const res = await GET();

    expect(await res.json()).toEqual({ settings: { autoSyncHours: null, staleAfterWeeks: 6 } });
  });

  it("saves valid settings", async () => {
    signIn();

    const res = await PUT(putRequest({ autoSyncHours: 24, staleAfterWeeks: 3 }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ settings: { autoSyncHours: 24, staleAfterWeeks: 3 } });
    expect(getUserSettings(userId)).toEqual({ autoSyncHours: 24, staleAfterWeeks: 3 });
  });

  it("rejects invalid settings and malformed JSON", async () => {
    signIn();

    expect((await PUT(putRequest({ autoSyncHours: 2 }))).status).toBe(400);
    expect((await PUT(putRequest("{not json"))).status).toBe(400);
    expect(getUserSettings(userId).autoSyncHours).toBeNull();
  });
});
