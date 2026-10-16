// __tests__/crypto/key.test.ts
import { describe, it, expect, afterEach, vi } from "vitest";
import fs, { type PathLike, type PathOrFileDescriptor } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getMasterEncryptionKey } from "@/lib/crypto";

describe("Master Encryption Key Management", () => {
  const originalEnvKey = process.env.APP_ENCRYPTION_KEY;

  afterEach(() => {
    process.env.APP_ENCRYPTION_KEY = originalEnvKey;
    vi.restoreAllMocks();
  });

  it("uses APP_ENCRYPTION_KEY env var if set", () => {
    const customKeyHex = crypto.randomBytes(32).toString("hex");
    process.env.APP_ENCRYPTION_KEY = customKeyHex;

    const key = getMasterEncryptionKey();
    expect(key.toString("hex")).toBe(customKeyHex);
  });

  it("handles non-hex APP_ENCRYPTION_KEY by hashing with sha256", () => {
    process.env.APP_ENCRYPTION_KEY = "simple-passphrase-string";
    const key = getMasterEncryptionKey();
    expect(key.length).toBe(32);
  });

  it("generates and saves key to file if no env var or file exists", () => {
    delete process.env.APP_ENCRYPTION_KEY;
    let writtenData = "";
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    vi.spyOn(fs, "mkdirSync").mockReturnValue(undefined);
    vi.spyOn(fs, "writeFileSync").mockImplementation((_targetPath: PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView) => {
      writtenData = String(data);
    });

    const key = getMasterEncryptionKey();
    expect(key.length).toBe(32);
    expect(writtenData.length).toBe(64);
  });

  it("reads existing key from primary file", () => {
    delete process.env.APP_ENCRYPTION_KEY;
    const primary = path.join(process.cwd(), "data", ".encryption_key");
    const fakeKey = crypto.randomBytes(32).toString("hex");

    vi.spyOn(fs, "existsSync").mockImplementation((checkPath: PathLike) => checkPath === primary);
    vi.spyOn(fs, "readFileSync").mockImplementation((targetPath: PathOrFileDescriptor) => {
      if (targetPath === primary) {
        return fakeKey;
      }
      throw new Error("File not found");
    });

    const key = getMasterEncryptionKey();
    expect(key.toString("hex")).toBe(fakeKey);
  });

  it("reads from legacy .data location if primary does not exist", () => {
    delete process.env.APP_ENCRYPTION_KEY;
    const primary = path.join(process.cwd(), "data", ".encryption_key");
    const legacy = path.join(process.cwd(), ".data", ".encryption_key");
    const legacyKey = crypto.randomBytes(32).toString("hex");

    vi.spyOn(fs, "existsSync").mockImplementation((checkPath: PathLike) => checkPath === legacy);
    vi.spyOn(fs, "readFileSync").mockImplementation((targetPath: PathOrFileDescriptor) => {
      if (targetPath === legacy) {
        return legacyKey;
      }
      throw new Error("File not found");
    });

    const key = getMasterEncryptionKey();
    expect(key.toString("hex")).toBe(legacyKey);
  });
});
