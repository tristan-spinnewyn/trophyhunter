// lib/security/url-validator.ts
import type { SafePlatformUrlResult } from "./security.types";

const ALLOWED_PROTOCOLS: ReadonlySet<string> = new Set(["https:", "http:"]);
const MAX_URL_LENGTH = 512;

export function validateSafeHttpUrl(rawUrl: string | undefined | null): SafePlatformUrlResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: true, normalizedUrl: undefined };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: true, normalizedUrl: undefined };
  }

  if (trimmed.length > MAX_URL_LENGTH) {
    return { valid: false, normalizedUrl: undefined };
  }

  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return { valid: false, normalizedUrl: undefined };
    }
    if (parsed.username || parsed.password) {
      return { valid: false, normalizedUrl: undefined };
    }
    return { valid: true, normalizedUrl: parsed.toString() };
  } catch {
    return { valid: false, normalizedUrl: undefined };
  }
}

export function sanitizeExternalHref(rawUrl: string | undefined | null): string | undefined {
  const result = validateSafeHttpUrl(rawUrl);
  return result.valid ? result.normalizedUrl : undefined;
}
