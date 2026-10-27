// __tests__/api/auth/rate_limit.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting } from "@/lib/db";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as postSyncHandler } from "@/app/api/user/sync/route";
import { createUser, createSession } from "@/lib/db";
import { resetRateLimiterForTesting } from "@/lib/security";
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

describe("Auth Rate Limiting & Sync Validation API", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    resetRateLimiterForTesting();
  });

  it("returns 429 when login rate limit is exceeded", async () => {
    for (let i = 0; i < 15; i++) {
      await loginHandler(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-forwarded-for": "10.1.1.1" },
          body: JSON.stringify({ username: "u", password: "p" }),
        })
      );
    }

    const blocked = await loginHandler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "10.1.1.1" },
        body: JSON.stringify({ username: "u", password: "p" }),
      })
    );
    expect(blocked.status).toBe(429);
  });

  it("returns 429 when one account is targeted from rotating IP addresses", async () => {
    createUser("victim", "correct-password");
    const attempt = (ip: string) =>
      loginHandler(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
          body: JSON.stringify({ username: "Victim", password: "wrong-password" }),
        })
      );

    for (let i = 0; i < 10; i++) {
      const res = await attempt(`10.9.0.${i}`);
      expect(res.status).toBe(401);
    }

    const blocked = await attempt("10.9.1.1");
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("returns 429 when register rate limit is exceeded", async () => {
    for (let i = 0; i < 10; i++) {
      await registerHandler(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-forwarded-for": "10.2.2.2" },
          body: JSON.stringify({ username: "ab", password: "123" }),
        })
      );
    }

    const blocked = await registerHandler(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "10.2.2.2" },
        body: JSON.stringify({ username: "validuser", password: "password123" }),
      })
    );
    expect(blocked.status).toBe(429);
  });

  it("returns 400 on oversized sync batch in POST /api/user/sync", async () => {
    const user = createUser("RateUser", "password123");
    const sessionId = createSession(user.id);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });

    const oversizedGames = Array.from({ length: 2005 }, (_, i) => ({
      appId: i + 1,
      platform: "steam",
      name: `G${i}`,
    }));

    const res = await postSyncHandler(
      new Request("http://localhost/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ games: oversizedGames }),
      })
    );
    expect(res.status).toBe(400);
  });
});
