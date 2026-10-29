// __tests__/crypto/password.test.ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/crypto";

describe("Password Hashing & Verification", () => {
  it("hashes and verifies correct passwords with scrypt", () => {
    const password = "mySecretPassword123!";
    const hash = hashPassword(password);

    expect(hash).toContain(":");
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword("wrongPassword", hash)).toBe(false);
  });

  it("returns false for invalid hash formats or empty passwords", () => {
    expect(verifyPassword("", "salt:hash")).toBe(false);
    expect(verifyPassword("pass", "")).toBe(false);
    expect(verifyPassword("pass", "invalidhashwithnosalt")).toBe(false);
    expect(verifyPassword("pass", "salt:invalid_hex_string")).toBe(false);
  });

  it("rejects passwords longer than 256 bytes", () => {
    expect(() => hashPassword("a".repeat(300))).toThrow("Password exceeds maximum allowed length");
    expect(verifyPassword("a".repeat(300), "salt:hash")).toBe(false);
  });

  it("runs a dummy verification when no hash is stored, so unknown usernames take as long", () => {
    expect(verifyPassword("AnyPassword123", null)).toBe(false);
  });
});
