// lib/epic-codenames.ts
import { KNOWN_EPIC_CODENAMES } from "./epic/codenames-dict";

export { KNOWN_EPIC_CODENAMES };

export const DEFAULT_EPIC_COVER =
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80";

export function isUnsplashPlaceholder(url?: string | null): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

export function resolveEpicCodename(codename: string): string | null {
  if (!codename) return null;
  const key = codename.trim().toLowerCase();
  return KNOWN_EPIC_CODENAMES[key] || null;
}
