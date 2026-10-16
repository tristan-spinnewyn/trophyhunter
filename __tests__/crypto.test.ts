import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  getMasterEncryptionKey,
  encryptSecret,
  decryptSecret,
  hashPassword,
  verifyPassword,
} from "../lib/crypto";

describe("lib/crypto", () => {
  const originalEnvKey = process.env.APP_ENCRYPTION_KEY;
  const testDataDir = path.join(process.cwd(), ".data");
  const testKeyFile = path.join(testDataDir, ".encryption_key");

  afterEach(() => {
    process.env.APP_ENCRYPTION_KEY = originalEnvKey;
  });

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
    });
  });

  describe("Secret Encryption & Decryption (AES-256-GCM)", () => {
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
      const valid = encryptSecret("test-secret");
      const tampered = valid.slice(0, -2) + "ff";

      expect(() => decryptSecret("enc_gcm:invalid:format")).toThrow();
      expect(() => decryptSecret(tampered)).toThrow();
    });

    it("uses APP_ENCRYPTION_KEY env var if set", () => {
      const customKeyHex = crypto.randomBytes(32).toString("hex");
      process.env.APP_ENCRYPTION_KEY = customKeyHex;

      const key = getMasterEncryptionKey();
      expect(key.toString("hex")).toBe(customKeyHex);

      const secret = "test-with-env-key";
      const encrypted = encryptSecret(secret);
      expect(decryptSecret(encrypted)).toBe(secret);
    });

    it("handles non-hex APP_ENCRYPTION_KEY by hashing with sha256", () => {
      process.env.APP_ENCRYPTION_KEY = "simple-passphrase-string";
      const key = getMasterEncryptionKey();
      expect(key.length).toBe(32);
    });

    it("generates and saves key to file if no env var or file exists", () => {
      delete process.env.APP_ENCRYPTION_KEY;
      const primary = path.join(process.cwd(), "data", ".encryption_key");
      const legacy = path.join(process.cwd(), ".data", ".encryption_key");
      if (fs.existsSync(primary)) fs.unlinkSync(primary);
      if (fs.existsSync(legacy)) fs.unlinkSync(legacy);

      const key = getMasterEncryptionKey();
      expect(key.length).toBe(32);
      expect(fs.existsSync(primary)).toBe(true);
    });

    it("reads existing key from primary file", () => {
      delete process.env.APP_ENCRYPTION_KEY;
      const keyPath = path.join(process.cwd(), "data", ".encryption_key");
      const fakeKey = crypto.randomBytes(32).toString("hex");
      fs.writeFileSync(keyPath, fakeKey, "utf8");

      const key = getMasterEncryptionKey();
      expect(key.toString("hex")).toBe(fakeKey);
    });

    it("reads from legacy .data location if primary does not exist", () => {
      delete process.env.APP_ENCRYPTION_KEY;
      const primaryPath = path.join(process.cwd(), "data", ".encryption_key");
      if (fs.existsSync(primaryPath)) fs.unlinkSync(primaryPath);

      const legacyDir = path.join(process.cwd(), ".data");
      if (!fs.existsSync(legacyDir)) fs.mkdirSync(legacyDir, { recursive: true });
      const legacyPath = path.join(legacyDir, ".encryption_key");
      const legacyKey = crypto.randomBytes(32).toString("hex");
      fs.writeFileSync(legacyPath, legacyKey, "utf8");

      const key = getMasterEncryptionKey();
      expect(key.toString("hex")).toBe(legacyKey);
    });
  });
});
