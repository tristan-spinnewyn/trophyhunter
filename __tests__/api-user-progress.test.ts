import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  saveUserOwnedGames,
  getUserGameProgress,
} from "@/lib/db";
import {
  GET as getProgressHandler,
  POST as postProgressHandler,
  DELETE as deleteProgressHandler,
} from "@/app/api/user/progress/route";

const mockCookieStore = new Map<string, any>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string, options: any) => {
      mockCookieStore.set(name, { name, value, ...options });
    },
    delete: (name: string) => {
      mockCookieStore.delete(name);
    },
  }),
}));

describe("User Game Progress API (/api/user/progress)", () => {
  let userId: string;

  beforeEach(() => {
    const db = initDatabase(":memory:");
    setDbForTesting(db);
    mockCookieStore.clear();

    const user = createUser("ProgressTester", "password123");
    userId = user.id;
    const sessionId = createSession(userId);
    mockCookieStore.set("trophyhunter_session", { value: sessionId });

    saveUserOwnedGames(userId, [
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

    const getRes = await getProgressHandler(
      new Request("http://localhost/api/user/progress?appId=100")
    );
    expect(getRes.status).toBe(401);

    const postRes = await postProgressHandler(
      new Request("http://localhost/api/user/progress", {
        method: "POST",
        body: JSON.stringify({ appId: 100, progress: { unlockedIds: ["ach_1"] } }),
      })
    );
    expect(postRes.status).toBe(401);

    const deleteRes = await deleteProgressHandler(
      new Request("http://localhost/api/user/progress?appId=100", {
        method: "DELETE",
      })
    );
    expect(deleteRes.status).toBe(401);
  });

  it("saves, retrieves and resets game progress for authenticated user", async () => {
    // 1. Save progress
    const postReq = new Request("http://localhost/api/user/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: 100,
        platform: "steam",
        progress: {
          unlockedIds: ["ach_1", "ach_2"],
          notes: { ach_1: "Important guide note" },
        },
      }),
    });

    const postRes = await postProgressHandler(postReq);
    expect(postRes.status).toBe(200);
    const postData = await postRes.json();
    expect(postData.success).toBe(true);
    expect(postData.progress.unlockedIds).toEqual(["ach_1", "ach_2"]);

    // 2. Retrieve progress via GET
    const getReq = new Request("http://localhost/api/user/progress?appId=100&platform=steam");
    const getRes = await getProgressHandler(getReq);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.progress.unlockedIds).toEqual(["ach_1", "ach_2"]);
    expect(getData.progress.notes["ach_1"]).toBe("Important guide note");

    // 3. Reset progress via DELETE
    const deleteReq = new Request("http://localhost/api/user/progress?appId=100&platform=steam", {
      method: "DELETE",
    });
    const deleteRes = await deleteProgressHandler(deleteReq);
    expect(deleteRes.status).toBe(200);

    const checkProg = getUserGameProgress(userId, 100, "steam");
    expect(checkProg).toBeNull();
  });
});
