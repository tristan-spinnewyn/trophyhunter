import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const KEY_FILE_PATH = path.join(process.cwd(), ".data", ".encryption_key");

/**
 * Retrieves or generates the 32-byte master encryption key.
 * If APP_ENCRYPTION_KEY environment variable is defined, it is used.
 * Otherwise, a random key is generated and saved in .data/.encryption_key.
 */
export function getMasterEncryptionKey(): Buffer {
  if (process.env.APP_ENCRYPTION_KEY) {
    const raw = process.env.APP_ENCRYPTION_KEY.trim();
    if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
      return Buffer.from(raw, "hex");
    }
    return crypto.createHash("sha256").update(raw).digest();
  }

  try {
    if (fs.existsSync(KEY_FILE_PATH)) {
      const stored = fs.readFileSync(KEY_FILE_PATH, "utf8").trim();
      if (stored.length === 64 && /^[0-9a-fA-F]+$/.test(stored)) {
        return Buffer.from(stored, "hex");
      }
    }
  } catch {
    // Ignore read errors and regenerate
  }

  const generatedKey = crypto.randomBytes(32);
  try {
    const dir = path.dirname(KEY_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(KEY_FILE_PATH, generatedKey.toString("hex"), {
      encoding: "utf8",
      mode: 0o600,
    });
  } catch (err) {
    console.warn("Could not persist encryption key to disk, using in-memory key:", err);
  }

  return generatedKey;
}

/**
 * Encrypts sensitive text (e.g. Steam API Key) using AES-256-GCM.
 * Output format: "enc_gcm:iv:tag:ciphertext" (hex encoded)
 */
export function encryptSecret(plainText: string, key?: Buffer): string {
  if (!plainText) return "";
  const masterKey = key || getMasterEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `enc_gcm:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts ciphertext produced by encryptSecret using AES-256-GCM.
 * Throws if authentication tag verification fails (tampered or corrupted data).
 */
export function decryptSecret(cipherText: string, key?: Buffer): string {
  if (!cipherText) return "";
  if (!cipherText.startsWith("enc_gcm:")) {
    // Return unchanged if not encrypted with enc_gcm prefix
    return cipherText;
  }

  const parts = cipherText.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted format");
  }

  const [, ivHex, tagHex, dataHex] = parts;
  const masterKey = key || getMasterEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(dataHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Hashes a user password using scrypt with a unique random salt.
 * Output format: "salt:hash" (hex encoded)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a password against a stored scrypt "salt:hash" string.
 * Uses timingSafeEqual to avoid timing side-channel attacks.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash || !storedHash.includes(":")) {
    return false;
  }

  const [salt, expectedHash] = storedHash.split(":");
  if (!salt || !expectedHash) return false;

  const derivedKey = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (derivedKey.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedKey, expectedBuffer);
}
