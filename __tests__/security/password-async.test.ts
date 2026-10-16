// __tests__/security/password-async.test.ts
import { describe, it, expect } from "vitest";
import {
  hashPasswordAsync,
  verifyPasswordConstantTime,
  PasswordValidationError,
  hashPassword,
  verifyPassword,
} from "@/lib/crypto";

describe("password-async and length limits", () => {
  it("hashes and verifies a valid password asynchronously", async () => {
    const hash = await hashPasswordAsync("StrongPass!2026");
    expect(await verifyPasswordConstantTime("StrongPass!2026", hash)).toBe(true);
    expect(await verifyPasswordConstantTime("WrongPass!2026", hash)).toBe(false);
  });

  it("rejects passwords shorter than 8 characters or exceeding 256 bytes", async () => {
    await expect(hashPasswordAsync("short")).rejects.toThrow(PasswordValidationError);
    await expect(hashPasswordAsync("a".repeat(300))).rejects.toThrow(PasswordValidationError);
    expect(() => hashPassword("a".repeat(300))).toThrow("Password exceeds maximum allowed length");
    expect(verifyPassword("a".repeat(300), "salt:hash")).toBe(false);
    expect(await verifyPasswordConstantTime("", "salt:hash")).toBe(false);
    expect(await verifyPasswordConstantTime("validPass123", "salt:short_hex")).toBe(false);
  });

  it("executes constant-time dummy verification when storedHash is null", async () => {
    expect(await verifyPasswordConstantTime("AnyPassword123", null)).toBe(false);
    expect(verifyPassword("AnyPassword123", null)).toBe(false);
  });
});
