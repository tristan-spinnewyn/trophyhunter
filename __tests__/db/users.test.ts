// __tests__/db/users.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initDatabase, setDbForTesting, createUser, authenticateUser } from "@/lib/db";

describe("Database Users", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("creates and authenticates a user", () => {
    const user = createUser("Tristan", "securePassword123", "Tristan S.");
    expect(user.id).toBeDefined();
    expect(user.username).toBe("tristan");
    expect(user.displayName).toBe("Tristan S.");

    const authSuccess = authenticateUser("Tristan", "securePassword123");
    expect(authSuccess).not.toBeNull();
    expect(authSuccess?.id).toBe(user.id);

    const authFailPass = authenticateUser("tristan", "wrongpass");
    expect(authFailPass).toBeNull();

    const authFailUser = authenticateUser("nonexistent", "securePassword123");
    expect(authFailUser).toBeNull();
  });

  it("prevents short usernames and short passwords", () => {
    expect(() => createUser("ab", "password123")).toThrow("Username must be at least 3 characters");
    expect(() => createUser("validUser", "12345")).toThrow("Password must be at least 6 characters");
  });

  it("prevents duplicate usernames", () => {
    createUser("GamerOne", "password123");
    expect(() => createUser("gamerone", "password123")).toThrow("Username already taken");
  });
});
