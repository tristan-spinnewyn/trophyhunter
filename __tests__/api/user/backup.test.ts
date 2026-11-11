// __tests__/api/user/backup.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, createSession, saveUserOwnedGames, getUserOwnedGames } from "@/lib/db";
import { GET, POST } from "@/app/api/user/backup/route";
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

const signIn = (username: string) => {
  const userId = createUser(username, "password123").id;
  mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(userId) });
  return userId;
};

describe("/api/user/backup", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("downloads a full backup and restores it into another account", async () => {
    const owner = signIn("BackupRouteOwner");
    saveUserOwnedGames(owner, [makeOwnedGame({ appId: 1, status: "paused", resumeNote: "Acte 2." })]);

    const exported = await GET();
    expect(exported.status).toBe(200);
    expect(exported.headers.get("Content-Disposition")).toMatch(/^attachment; filename="trophyhunter-sauvegarde-\d{4}-\d{2}-\d{2}\.json"$/);
    const backup = await exported.json();

    const restored = signIn("BackupRouteRestored");
    const res = await POST(new Request("http://localhost/api/user/backup", { method: "POST", body: JSON.stringify(backup) }));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, restored: { games: 1 } });
    expect(getUserOwnedGames(restored)[0]).toMatchObject({ status: "paused", resumeNote: "Acte 2." });
  });

  it("refuses a file that is not a full backup", async () => {
    signIn("BackupRouteBad");

    const res = await POST(new Request("http://localhost/api/user/backup", { method: "POST", body: JSON.stringify({ games: [] }) }));
    const notJson = await POST(new Request("http://localhost/api/user/backup", { method: "POST", body: "{" }));

    expect(res.status).toBe(400);
    expect(notJson.status).toBe(400);
  });

  it("refuses a visitor", async () => {
    expect((await GET()).status).toBe(401);
    expect((await POST(new Request("http://localhost/api/user/backup", { method: "POST", body: "{}" }))).status).toBe(401);
  });
});
