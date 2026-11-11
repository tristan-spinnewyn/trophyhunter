// __tests__/api/user/resume_note.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession, saveUserOwnedGames, getUserOwnedGames } from "@/lib/db";
import { PATCH } from "@/app/api/user/games/route";
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

function patch(body: unknown): Request {
  return new Request("http://localhost/api/user/games", { method: "PATCH", body: JSON.stringify(body) });
}

describe("PATCH /api/user/games (resume note)", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    userId = createUser("ResumeRouteUser", "password123").id;
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(userId) });
    saveUserOwnedGames(userId, [
      { appId: 367520, name: "Hollow Knight", headerImg: "", platform: "steam", totalAchievements: 0, unlockedCount: 0, addedAt: "2026-01-01", status: "paused" },
    ]);
  });

  it("saves a note", async () => {
    const res = await PATCH(patch({ appId: 367520, platform: "steam", resumeNote: " Boss Hornet. " }));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, resumeNote: "Boss Hornet." });
    expect(getUserOwnedGames(userId)[0].resumeNote).toBe("Boss Hornet.");
  });

  it("clears it with a blank note", async () => {
    await PATCH(patch({ appId: 367520, platform: "steam", resumeNote: "Boss Hornet." }));

    await PATCH(patch({ appId: 367520, platform: "steam", resumeNote: "" }));

    expect(getUserOwnedGames(userId)[0].resumeNote).toBeUndefined();
  });

  it("rejects an invalid note or a missing appId", async () => {
    expect((await PATCH(patch({ appId: 367520, platform: "steam", resumeNote: 3 }))).status).toBe(400);
    expect((await PATCH(patch({ platform: "steam", resumeNote: "x" }))).status).toBe(400);
  });

  it("answers 404 for a game outside the collection", async () => {
    expect((await PATCH(patch({ appId: 1, platform: "steam", resumeNote: "x" }))).status).toBe(404);
  });
});
