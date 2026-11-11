// __tests__/api/user/time_to_beat.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession } from "@/lib/db";
import type { CookieRecord } from "../../helpers/cookies";

const { mockCookieStore, getBacklogTimeToBeat } = vi.hoisted(() => ({
  mockCookieStore: new Map<string, CookieRecord>(),
  getBacklogTimeToBeat: vi.fn(),
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
vi.mock("@/lib/igdb/backlog-time-to-beat", () => ({ getBacklogTimeToBeat }));

import { GET } from "@/app/api/user/time-to-beat/route";

describe("GET /api/user/time-to-beat", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    getBacklogTimeToBeat.mockReset();
    userId = createUser("TimeUser", "password123").id;
  });

  it("does not spend the IGDB keys on an anonymous caller", async () => {
    const res = await GET();

    expect(res.status).toBe(401);
    expect(getBacklogTimeToBeat).not.toHaveBeenCalled();
  });

  it("returns the durations of the signed-in user's backlog", async () => {
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(userId) });
    getBacklogTimeToBeat.mockResolvedValue({ steam_620: { hastilySeconds: 28800, normallySeconds: 36000, completelySeconds: null } });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ durations: { steam_620: { hastilySeconds: 28800, normallySeconds: 36000, completelySeconds: null } } });
    expect(getBacklogTimeToBeat).toHaveBeenCalledWith(userId);
  });
});
