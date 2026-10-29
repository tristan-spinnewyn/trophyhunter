// __tests__/crypto/cipher.test.ts
import { describe, it, expect, afterEach, vi } from "vitest";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

describe("Secret Encryption & Decryption (AES-256-GCM)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("encrypts and decrypts secret string correctly", () => {
    const plainSecret = "B1234567890ABCDEF1234567890ABCDE";
    const encrypted = encryptSecret(plainSecret);

    expect(encrypted.startsWith("enc_gcm:")).toBe(true);
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(plainSecret);
  });

  it("returns empty string for empty inputs", () => {
    expect(encryptSecret("")).toBe("");
    expect(decryptSecret("")).toBe("");
  });

  it("handles plaintext if not starting with enc_gcm:", () => {
    expect(decryptSecret("plainTextKey")).toBe("plainTextKey");
  });

  it("throws error if ciphertext format is corrupted or tampered", () => {
    // A ciphertext already ending in "ff" is the 1-in-256 case where the old tampering changed nothing.
    let valid = encryptSecret("test-secret");
    while (!valid.endsWith("ff")) valid = encryptSecret("test-secret");
    // Flipping every bit of the last hex digit always yields a different digit.
    const lastDigit = parseInt(valid.slice(-1), 16);
    const tampered = valid.slice(0, -1) + (lastDigit ^ 0xf).toString(16);

    expect(tampered).not.toBe(valid);
    expect(() => decryptSecret("enc_gcm:invalid:format")).toThrow();
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
