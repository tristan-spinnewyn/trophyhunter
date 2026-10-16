// lib/crypto/password.ts
import crypto from "node:crypto";

const MAX_PASSWORD_BYTES = 256;
const DUMMY_STORED_HASH = `${"0".repeat(32)}:${"0".repeat(128)}`;

export function hashPassword(password: string): string {
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    throw new Error("Password exceeds maximum allowed length");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!password || Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    return false;
  }

  const hasValidStored = Boolean(storedHash && storedHash.includes(":"));
  const targetHash = hasValidStored ? (storedHash as string) : DUMMY_STORED_HASH;

  const [salt, expectedHash] = targetHash.split(":");
  if (!salt || !expectedHash) return false;

  const derivedKey = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (derivedKey.length !== expectedBuffer.length) {
    return false;
  }

  const isEqual = crypto.timingSafeEqual(derivedKey, expectedBuffer);
  return hasValidStored && isEqual;
}
