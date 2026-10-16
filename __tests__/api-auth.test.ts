import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDatabase, setDbForTesting } from "@/lib/db";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { GET as meHandler } from "@/app/api/auth/me/route";

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

describe("Auth API Routes", () => {
  beforeEach(() => {
    const db = initDatabase(":memory:");
    setDbForTesting(db);
    mockCookieStore.clear();
  });

  describe("POST /api/auth/register", () => {
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

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
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
      const res = await loginHandler(wrongPassReq);
      expect(res.status).toBe(401);

      const missingReq = new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "" }),
      });
      const res2 = await loginHandler(missingReq);
      expect(res2.status).toBe(400);
    });
  });

  describe("GET /api/auth/me & POST /api/auth/logout", () => {
    it("returns null user when unauthenticated, and user when logged in", async () => {
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
});
