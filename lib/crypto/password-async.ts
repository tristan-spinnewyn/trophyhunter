// lib/crypto/password-async.ts
import crypto from "node:crypto";

const MAX_PASSWORD_BYTES = 256;
const KEY_LENGTH = 64;
const DUMMY_HASH = `${"0".repeat(32)}:${"0".repeat(128)}`;

export class PasswordValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordValidationError";
  }
}

function deriveScryptKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPasswordAsync(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new PasswordValidationError("Password must be at least 8 characters");
  }
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    throw new PasswordValidationError("Password exceeds maximum allowed length");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await deriveScryptKey(password, salt);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPasswordConstantTime(
  password: string,
  storedHash: string | null | undefined
): Promise<boolean> {
  if (!password || Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    return false;
  }

  const targetHash = storedHash && storedHash.includes(":") ? storedHash : DUMMY_HASH;
  const [salt, expectedHex] = targetHash.split(":");
  if (!salt || !expectedHex) return false;

  const derivedKey = await deriveScryptKey(password, salt);
  const expectedBuffer = Buffer.from(expectedHex, "hex");

  if (derivedKey.length !== expectedBuffer.length) {
    return false;
  }

  const isMatch = crypto.timingSafeEqual(derivedKey, expectedBuffer);
  return Boolean(storedHash) && isMatch;
}
