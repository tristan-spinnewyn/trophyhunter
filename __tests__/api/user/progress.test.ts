// __tests__/api/user/progress.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  saveUserOwnedGames,
} from "@/lib/db";
import {
  GET as getProgressHandler,
  POST as postProgressHandler,
  DELETE as deleteProgressHandler,
} from "@/app/api/user/progress/route";
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
    delete: (name: string) => { mockCookieStore.delete(name); },
  }),
}));

describe("User Progress API", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();

    const user = createUser("ProgressTester", "password123");
    const sessionId = createSession(user.id);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });

    saveUserOwnedGames(user.id, [
      {
        appId: 100,
        name: "Test Game",
        headerImg: "",
        platform: "steam",
        totalAchievements: 10,
        unlockedCount: 0,
        addedAt: new Date().toISOString(),
      },
    ]);
  });

  it("returns 401 when unauthenticated", async () => {
    mockCookieStore.clear();

    const getRes = await getProgressHandler(new Request("http://localhost/api/user/progress?appId=100"));
    expect(getRes.status).toBe(401);

    const postRes = await postProgressHandler(
      new Request("http://localhost/api/user/progress", {
        method: "POST",
        body: JSON.stringify({ appId: 100, progress: { unlockedIds: ["ach_1"] } }),
      })
    );
    expect(postRes.status).toBe(401);

    const deleteRes = await deleteProgressHandler(new Request("http://localhost/api/user/progress?appId=100", { method: "DELETE" }));
    expect(deleteRes.status).toBe(401);
  });

  it("saves, retrieves and resets game progress with pinnedIds and huntingMeta", async () => {
    const postRes = await postProgressHandler(
      new Request("http://localhost/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: 100,
          platform: "steam",
          progress: {
            unlockedIds: ["ach_1", "ach_2"],
            notes: { ach_1: "Important guide note" },
            pinnedIds: ["ach_3"],
            huntingMeta: { difficultyRating: 7, estimatedHours: 35, warningType: "online-required" },
          },
        }),
      })
    );
    expect(postRes.status).toBe(200);

    const getRes = await getProgressHandler(new Request("http://localhost/api/user/progress?appId=100&platform=steam"));
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.progress.unlockedIds).toEqual(["ach_1", "ach_2"]);
    expect(getData.progress.pinnedIds).toEqual(["ach_3"]);
    expect(getData.progress.huntingMeta.difficultyRating).toBe(7);

    const deleteRes = await deleteProgressHandler(new Request("http://localhost/api/user/progress?appId=100&platform=steam", { method: "DELETE" }));
    expect(deleteRes.status).toBe(200);
  });
});
