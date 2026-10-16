// __tests__/api/auth/register.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting } from "@/lib/db";
import { POST as registerHandler } from "@/app/api/auth/register/route";
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

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
  });

  it("registers a new user successfully and sets session cookie", async () => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "hunter123",
        password: "passwordSafe99",
        displayName: "Trophy Master",
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.username).toBe("hunter123");
    expect(data.user.displayName).toBe("Trophy Master");
    expect(mockCookieStore.has("trophyhunter_session")).toBe(true);
  });

  it("rejects invalid username or short password", async () => {
    const shortUserReq = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "ab", password: "password123" }),
    });
    const res1 = await registerHandler(shortUserReq);
    expect(res1.status).toBe(400);

    const shortPassReq = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "validUser", password: "123" }),
    });
    const res2 = await registerHandler(shortPassReq);
    expect(res2.status).toBe(400);
  });

  it("returns 409 when username is already taken", async () => {
    const makeReq = () =>
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "existingUser", password: "password123" }),
      });

    const res1 = await registerHandler(makeReq());
    expect(res1.status).toBe(201);

    const res2 = await registerHandler(makeReq());
    expect(res2.status).toBe(409);
  });
});
