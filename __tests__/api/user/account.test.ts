// __tests__/api/user/account.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  getUserPlatformAccounts,
} from "@/lib/db";
import {
  GET as getAccountHandler,
  POST as postAccountHandler,
  DELETE as deleteAccountHandler,
} from "@/app/api/user/account/route";
import type { PlatformAccount } from "@/lib/types";
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

describe("User Account API", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();

    const user = createUser("AccountTester", "password123");
    userId = user.id;
    const sessionId = createSession(userId);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });
  });

  it("returns 401 when unauthenticated and validates empty payload", async () => {
    mockCookieStore.clear();
    expect((await getAccountHandler()).status).toBe(401);

    const postUnauth = await postAccountHandler(
      new Request("http://localhost/api/user/account", {
        method: "POST",
        body: JSON.stringify({ account: { platform: "steam", username: "test" } }),
      })
    );
    expect(postUnauth.status).toBe(401);

    const deleteUnauth = await deleteAccountHandler(
      new Request("http://localhost/api/user/account?platform=steam", { method: "DELETE" })
    );
    expect(deleteUnauth.status).toBe(401);

    const sessionId = createSession(userId);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });
    const emptyPost = await postAccountHandler(
      new Request("http://localhost/api/user/account", { method: "POST", body: JSON.stringify({}) })
    );
    expect(emptyPost.status).toBe(400);
  });

  it("saves, retrieves and deletes platform accounts", async () => {
    const steamAcc: PlatformAccount = {
      platform: "steam",
      username: "76561198000000000",
      displayName: "GamerOne",
      connectedAt: new Date().toISOString(),
      stats: { gamesOwned: 10, totalAchievements: 150, completedGames: 2 },
    };

    const postRes = await postAccountHandler(
      new Request("http://localhost/api/user/account", {
        method: "POST",
        body: JSON.stringify({ account: steamAcc }),
      })
    );
    expect(postRes.status).toBe(200);
    expect(getUserPlatformAccounts(userId).steam?.username).toBe("76561198000000000");

    const getRes = await getAccountHandler();
    expect(getRes.status).toBe(200);

    const delRes = await deleteAccountHandler(
      new Request("http://localhost/api/user/account?platform=steam", { method: "DELETE" })
    );
    expect(delRes.status).toBe(200);
    expect(getUserPlatformAccounts(userId).steam).toBeUndefined();
  });
});
