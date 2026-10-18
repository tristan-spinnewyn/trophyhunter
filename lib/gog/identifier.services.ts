// lib/gog/identifier.services.ts
import { GogSyncError } from "./gog.types";

export function parseGogUsername(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new GogSyncError("Paramètre 'user' (pseudo GOG) requis.", 400);
  }

  const urlMatch = trimmed.match(/gog\.com\/(?:[a-z]{2}\/)?u\/([^\s/?#]+)/i);
  if (urlMatch && urlMatch[1]) {
    return decodeURIComponent(urlMatch[1].trim());
  }

  const cleaned = trimmed.replace(/^@/, "").split(/[/?#]/)[0]?.trim() || "";
  if (!cleaned || cleaned.includes(":")) {
    throw new GogSyncError("Identifiant ou URL GOG invalide.", 400);
  }

  return cleaned;
}

export function normalizeGogImageUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  const unescaped = rawUrl.replace(/\\\//g, "/").trim();
  if (unescaped.startsWith("//")) {
    return `https:${unescaped}`;
  }
  return unescaped;
}
