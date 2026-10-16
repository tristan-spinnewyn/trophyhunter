import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

  afterEach(() => {
    process.env.APP_ENCRYPTION_KEY = originalEnvKey;
    vi.restoreAllMocks();
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
      let writtenData = "";
      const spyExists = vi.spyOn(fs, "existsSync").mockReturnValue(false);
      const spyMkdir = vi.spyOn(fs, "mkdirSync").mockImplementation((() => undefined) as any);
      const spyWrite = vi.spyOn(fs, "writeFileSync").mockImplementation(((_p: any, data: any) => {
        writtenData = String(data);
        return undefined;
      }) as any);

      const key = getMasterEncryptionKey();
      expect(key.length).toBe(32);
      expect(spyWrite).toHaveBeenCalled();
      expect(writtenData.length).toBe(64);

      spyExists.mockRestore();
      spyMkdir.mockRestore();
      spyWrite.mockRestore();
    });

    it("reads existing key from primary file", () => {
      delete process.env.APP_ENCRYPTION_KEY;
      const primary = path.join(process.cwd(), "data", ".encryption_key");
      const fakeKey = crypto.randomBytes(32).toString("hex");
      const spyExists = vi.spyOn(fs, "existsSync").mockImplementation((p: any) => p === primary);
      const spyRead = vi.spyOn(fs, "readFileSync").mockImplementation(((p: any) => {
        if (p === primary) return fakeKey;
        throw new Error("File not found");
      }) as any);

      const key = getMasterEncryptionKey();
      expect(key.toString("hex")).toBe(fakeKey);

      spyExists.mockRestore();
      spyRead.mockRestore();
    });

    it("reads from legacy .data location if primary does not exist", () => {
      delete process.env.APP_ENCRYPTION_KEY;
      const primary = path.join(process.cwd(), "data", ".encryption_key");
      const legacy = path.join(process.cwd(), ".data", ".encryption_key");
      const legacyKey = crypto.randomBytes(32).toString("hex");
      const spyExists = vi.spyOn(fs, "existsSync").mockImplementation((p: any) => p === legacy);
      const spyRead = vi.spyOn(fs, "readFileSync").mockImplementation(((p: any) => {
        if (p === legacy) return legacyKey;
        throw new Error("File not found");
      }) as any);

      const key = getMasterEncryptionKey();
      expect(key.toString("hex")).toBe(legacyKey);

      spyExists.mockRestore();
      spyRead.mockRestore();
    });
  });
});
