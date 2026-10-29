// __tests__/lib/accounts/registration-policy.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isRegistrationOpen } from "@/lib/accounts/registration-policy";
import { initDatabase, setDbForTesting, createUser } from "@/lib/db";

describe("isRegistrationOpen", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    vi.stubEnv("ALLOW_REGISTRATION", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is open while the instance has no account, so the owner can sign up", () => {
    expect(isRegistrationOpen()).toBe(true);
  });

  it("closes once the first account exists", () => {
    createUser("owner", "password123");
    expect(isRegistrationOpen()).toBe(false);
  });

  it("stays open when the owner sets ALLOW_REGISTRATION=true", () => {
    createUser("owner", "password123");
    vi.stubEnv("ALLOW_REGISTRATION", " TRUE ");
    expect(isRegistrationOpen()).toBe(true);
  });

  it("ignores any other ALLOW_REGISTRATION value", () => {
    createUser("owner", "password123");
    vi.stubEnv("ALLOW_REGISTRATION", "1");
    expect(isRegistrationOpen()).toBe(false);
  });
});
