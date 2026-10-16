// lib/crypto/cipher.ts
import crypto from "node:crypto";
import { getMasterEncryptionKey } from "./key";

/**
 * Encrypts sensitive text using AES-256-GCM.
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
 */
export function decryptSecret(cipherText: string, key?: Buffer): string {
  if (!cipherText) return "";
  if (!cipherText.startsWith("enc_gcm:")) {
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
