// lib/storage/crypto.ts
import { STEAM_API_KEY, STEAM_USER_KEY } from "./constants";

const ENC_PREFIX = "enc_v1:";

function encryptSensitiveData(plainText: string): string {
  if (!plainText) return "";
  const salt = 0x5a;
  const chars = Array.from(plainText).map((c, i) =>
    (c.charCodeAt(0) ^ salt ^ ((i * 7) % 255)).toString(16).padStart(2, "0")
  );
  return ENC_PREFIX + chars.join("");
}

function decryptSensitiveData(cipherText: string): string {
  if (!cipherText) return "";
  if (!cipherText.startsWith(ENC_PREFIX)) {
    return cipherText;
  }
  const hex = cipherText.slice(ENC_PREFIX.length);
  const salt = 0x5a;
  let result = "";
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    const charCode = byte ^ salt ^ (((i / 2) * 7) % 255);
    result += String.fromCharCode(charCode);
  }
  return result;
}

export function getSavedSteamUser(): string {
  if (typeof window === "undefined") return "";
  const saved = localStorage.getItem(STEAM_USER_KEY);
  if (saved !== null) return saved;
  return "";
}

export function saveSteamUser(user: string): void {
  if (typeof window === "undefined") return;
  if (!user.trim()) {
    localStorage.removeItem(STEAM_USER_KEY);
  } else {
    localStorage.setItem(STEAM_USER_KEY, user.trim());
  }
}

export function getSavedSteamApiKey(): string {
  if (typeof window === "undefined") return "";
  const raw = localStorage.getItem(STEAM_API_KEY) || "";
  return decryptSensitiveData(raw);
}

export function saveSteamApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (!key.trim()) {
    localStorage.removeItem(STEAM_API_KEY);
  } else {
    localStorage.setItem(STEAM_API_KEY, encryptSensitiveData(key.trim()));
  }
}
