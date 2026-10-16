// lib/crypto/key.ts
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const PRIMARY_KEY_PATH = path.join(process.cwd(), "data", ".encryption_key");
const LEGACY_KEY_PATH = path.join(process.cwd(), ".data", ".encryption_key");

/**
 * Retrieves or generates the 32-byte master encryption key.
 */
export function getMasterEncryptionKey(): Buffer {
  if (process.env.APP_ENCRYPTION_KEY) {
    const raw = process.env.APP_ENCRYPTION_KEY.trim();
    if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
      return Buffer.from(raw, "hex");
    }
    return crypto.createHash("sha256").update(raw).digest();
  }

  for (const keyPath of [PRIMARY_KEY_PATH, LEGACY_KEY_PATH]) {
    try {
      if (fs.existsSync(/* turbopackIgnore: true */ keyPath)) {
        const stored = fs.readFileSync(/* turbopackIgnore: true */ keyPath, "utf8").trim();
        if (stored.length === 64 && /^[0-9a-fA-F]+$/.test(stored)) {
          return Buffer.from(stored, "hex");
        }
      }
    } catch {
      // Ignore read errors and regenerate
    }
  }

  const generatedKey = crypto.randomBytes(32);
  const hexKey = generatedKey.toString("hex");

  for (const keyPath of [PRIMARY_KEY_PATH, LEGACY_KEY_PATH]) {
    try {
      const dir = path.dirname(keyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(keyPath, hexKey, {
        encoding: "utf8",
        mode: 0o600,
      });
      return generatedKey;
    } catch {
      // Try next location
    }
  }

  console.warn("Could not persist encryption key to disk, using in-memory key");
  return generatedKey;
}
