// __tests__/auth/session.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser } from "@/lib/db";
import {
  getAuthenticatedUser,
  setAuthSessionCookie,
  clearAuthSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import type { CookieRecord } from "../helpers/cookies";

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

describe("Auth Session Lifecycle", () => {
  let userId: string;

  beforeEach(() => {
    const db = initDatabase(":memory:");
    setDbForTesting(db);
    mockCookieStore.clear();

    const user = createUser("AuthTestUser", "password123");
    userId = user.id;
  });

  it("sets and retrieves authenticated user from session cookie", async () => {
    expect(await getAuthenticatedUser()).toBeNull();

    const sessionId = await setAuthSessionCookie(userId);
    expect(sessionId).toBeDefined();
    expect(mockCookieStore.has(SESSION_COOKIE_NAME)).toBe(true);

    const user = await getAuthenticatedUser();
    expect(user).not.toBeNull();
    expect(user?.username).toBe("authtestuser");

    await clearAuthSessionCookie();
    expect(mockCookieStore.has(SESSION_COOKIE_NAME)).toBe(false);
    expect(await getAuthenticatedUser()).toBeNull();
  });
});
