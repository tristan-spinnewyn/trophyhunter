// __tests__/api/auth/me_logout.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting } from "@/lib/db";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { GET as meHandler } from "@/app/api/auth/me/route";
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
    delete: (name: string) => {
      mockCookieStore.delete(name);
    },
  }),
}));

describe("GET /api/auth/me & POST /api/auth/logout", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
  });

  it("handles user identity retrieval and logout lifecycle", async () => {
    const unauthRes = await meHandler();
    const unauthData = await unauthRes.json();
    expect(unauthData.user).toBeNull();

    const regReq = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "meUser", password: "password123" }),
    });
    await registerHandler(regReq);

    const authRes = await meHandler();
    const authData = await authRes.json();
    expect(authData.user).not.toBeNull();
    expect(authData.user.username).toBe("meuser");

    const logoutRes = await logoutHandler();
    expect(logoutRes.status).toBe(200);
    expect(mockCookieStore.has("trophyhunter_session")).toBe(false);

    const afterLogoutRes = await meHandler();
    const afterLogoutData = await afterLogoutRes.json();
    expect(afterLogoutData.user).toBeNull();
  });
});
