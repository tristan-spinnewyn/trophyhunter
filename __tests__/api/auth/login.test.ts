// __tests__/api/auth/login.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting } from "@/lib/db";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
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

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();

    const regReq = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "loginUser", password: "correctPassword" }),
    });
    await registerHandler(regReq);
    mockCookieStore.clear();
  });

  it("logs in successfully with valid credentials", async () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "loginUser", password: "correctPassword" }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user.username).toBe("loginuser");
    expect(mockCookieStore.has("trophyhunter_session")).toBe(true);
  });

  it("rejects login with wrong password or missing fields", async () => {
    const wrongPassReq = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "loginUser", password: "wrong" }),
    });
    const res1 = await loginHandler(wrongPassReq);
    expect(res1.status).toBe(401);

    const missingReq = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "" }),
    });
    const res2 = await loginHandler(missingReq);
    expect(res2.status).toBe(400);
  });
});
