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

describe("User Account API (/api/user/account)", () => {
  let userId: string;

  beforeEach(() => {
    const db = initDatabase(":memory:");
    setDbForTesting(db);
    mockCookieStore.clear();

    const user = createUser("AccountTester", "password123");
    userId = user.id;
    const sessionId = createSession(userId);
    mockCookieStore.set("trophyhunter_session", { value: sessionId });
  });

  it("returns 401 when unauthenticated", async () => {
    mockCookieStore.clear();

    const getRes = await getAccountHandler();
    expect(getRes.status).toBe(401);

    const postRes = await postAccountHandler(
      new Request("http://localhost/api/user/account", {
        method: "POST",
        body: JSON.stringify({ account: { platform: "steam", username: "test" } }),
      })
    );
    expect(postRes.status).toBe(401);

    const deleteRes = await deleteAccountHandler(
      new Request("http://localhost/api/user/account?platform=steam", { method: "DELETE" })
    );
    expect(deleteRes.status).toBe(401);
  });

  it("returns accounts for authenticated user via GET", async () => {
    const res = await getAccountHandler();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.accounts).toEqual({});
  });

  it("validates account payload on POST", async () => {
    const res = await postAccountHandler(
      new Request("http://localhost/api/user/account", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
  });

  it("saves and returns platform account on POST", async () => {
    const steamAcc: PlatformAccount = {
      platform: "steam",
      username: "76561198000000000",
      displayName: "GamerOne",
      avatarUrl: "https://example.com/avatar.jpg",
      connectedAt: new Date().toISOString(),
      stats: {
        gamesOwned: 10,
        totalAchievements: 150,
        completedGames: 2,
      },
    };

    const res = await postAccountHandler(
      new Request("http://localhost/api/user/account", {
        method: "POST",
        body: JSON.stringify({ account: steamAcc }),
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.accounts.steam.displayName).toBe("GamerOne");

    const saved = getUserPlatformAccounts(userId);
    expect(saved.steam?.username).toBe("76561198000000000");
  });

  it("deletes a platform account on DELETE", async () => {
    const xboxAcc: PlatformAccount = {
      platform: "xbox",
      username: "XboxPlayer",
      displayName: "XboxPlayer",
      connectedAt: new Date().toISOString(),
      stats: {
        gamesOwned: 5,
        totalAchievements: 50,
        completedGames: 1,
      },
    };

    await postAccountHandler(
      new Request("http://localhost/api/user/account", {
        method: "POST",
        body: JSON.stringify({ account: xboxAcc }),
      })
    );

    // Invalid platform
    const invalidDel = await deleteAccountHandler(
      new Request("http://localhost/api/user/account?platform=invalid", { method: "DELETE" })
    );
    expect(invalidDel.status).toBe(400);

    // Valid delete
    const delRes = await deleteAccountHandler(
      new Request("http://localhost/api/user/account?platform=xbox", { method: "DELETE" })
    );
    expect(delRes.status).toBe(200);
    const delData = await delRes.json();
    expect(delData.success).toBe(true);
    expect(delData.accounts.xbox).toBeUndefined();

    const saved = getUserPlatformAccounts(userId);
    expect(saved.xbox).toBeUndefined();
  });
});
