// __tests__/auth/errors.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting } from "@/lib/db";
import {
  getAuthenticatedUser,
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

describe("Auth Error Handling", () => {
  beforeEach(() => {
    const db = initDatabase(":memory:");
    setDbForTesting(db);
    mockCookieStore.clear();
  });

  it("returns null when session token is invalid or non-existent in database", async () => {
    mockCookieStore.set(SESSION_COOKIE_NAME, {
      name: SESSION_COOKIE_NAME,
      value: "invalid_non_existent_token",
    });

    const user = await getAuthenticatedUser();
    expect(user).toBeNull();
  });

  it("safely handles clear session when no session cookie exists", async () => {
    await expect(clearAuthSessionCookie()).resolves.toBeUndefined();
    expect(mockCookieStore.has(SESSION_COOKIE_NAME)).toBe(false);
  });
});
