// __tests__/db/sessions.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  validateSession,
  deleteSession,
  getUserById,
} from "@/lib/db";

describe("Database Sessions", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("manages user sessions with expiration and deletion", () => {
    const user = createUser("SessionUser", "password123");
    const sessionId = createSession(user.id);
    expect(sessionId).toBeDefined();

    const sessionUser = validateSession(sessionId);
    expect(sessionUser).not.toBeNull();
    expect(sessionUser?.id).toBe(user.id);

    const byId = getUserById(user.id);
    expect(byId?.username).toBe("sessionuser");

    deleteSession(sessionId);
    expect(validateSession(sessionId)).toBeNull();
    expect(validateSession("")).toBeNull();
    expect(validateSession("nonexistent-token")).toBeNull();
  });
});
