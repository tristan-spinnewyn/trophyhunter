// __tests__/security/url-validator.test.ts
import { describe, it, expect } from "vitest";
import { validateSafeHttpUrl, sanitizeExternalHref } from "@/lib/security/url-validator";

describe("validateSafeHttpUrl", () => {
  it("accepts valid https and http URLs", () => {
    const res = validateSafeHttpUrl("https://steamcommunity.com/id/player");
    expect(res.valid).toBe(true);
    expect(res.normalizedUrl).toBe("https://steamcommunity.com/id/player");
  });

  it("rejects javascript, data, and file protocol URIs", () => {
    expect(validateSafeHttpUrl("javascript:alert(1)").valid).toBe(false);
    expect(validateSafeHttpUrl("JAVASCRIPT:alert(document.cookie)").valid).toBe(false);
    expect(validateSafeHttpUrl("data:text/html,<script>alert(1)</script>").valid).toBe(false);
    expect(validateSafeHttpUrl("file:///etc/passwd").valid).toBe(false);
  });

  it("rejects URLs containing embedded credentials", () => {
    expect(validateSafeHttpUrl("https://admin:secret@example.com").valid).toBe(false);
  });

  it("rejects overly long URLs and malformed strings", () => {
    const longUrl = `https://example.com/${"a".repeat(600)}`;
    expect(validateSafeHttpUrl(longUrl).valid).toBe(false);
    expect(sanitizeExternalHref("not-a-valid-url")).toBeUndefined();
  });

  it("handles empty, whitespace, or nullish inputs gracefully", () => {
    expect(validateSafeHttpUrl(undefined)).toEqual({ valid: true, normalizedUrl: undefined });
    expect(validateSafeHttpUrl(null)).toEqual({ valid: true, normalizedUrl: undefined });
    expect(validateSafeHttpUrl("   ")).toEqual({ valid: true, normalizedUrl: undefined });
  });
});
