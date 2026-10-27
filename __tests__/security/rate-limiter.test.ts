// __tests__/security/rate-limiter.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  extractClientKey,
  resetRateLimiterForTesting,
} from "@/lib/security/rate-limiter";

describe("rate-limiter", () => {
  beforeEach(() => {
    resetRateLimiterForTesting();
  });

  it("extracts client key from the proxy-appended x-forwarded-for entry, x-real-ip, or fallback", () => {
    const req1 = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });
    expect(extractClientKey(req1, "login")).toBe("login:10.0.0.1");

    const req2 = new Request("http://localhost/api", {
      headers: { "x-real-ip": "198.51.100.5" },
    });
    expect(extractClientKey(req2, "login")).toBe("login:198.51.100.5");

    const req3 = new Request("http://localhost/api");
    expect(extractClientKey(req3, "login")).toBe("login:local");
  });

  it("ignores client-spoofed entries prepended to x-forwarded-for", () => {
    const spoofed = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "1.2.3.4, 198.51.100.7" },
    });
    const otherSpoof = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "5.6.7.8, 198.51.100.7" },
    });
    expect(extractClientKey(spoofed, "login")).toBe(extractClientKey(otherSpoof, "login"));
  });

  it("allows requests within threshold and blocks when exceeded", () => {
    const config = { windowMs: 10_000, maxRequests: 2 };
    const r1 = checkRateLimit("ip:127.0.0.1", config, 1000);
    const r2 = checkRateLimit("ip:127.0.0.1", config, 2000);
    const blocked = checkRateLimit("ip:127.0.0.1", config, 3000);

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(8);

    const afterExpiry = checkRateLimit("ip:127.0.0.1", config, 12_000);
    expect(afterExpiry.allowed).toBe(true);
  });

  it("evicts expired buckets when capacity reaches MAX_BUCKETS", () => {
    const config = { windowMs: 1000, maxRequests: 5 };
    for (let i = 0; i < 5000; i++) {
      checkRateLimit(`ip:${i}`, config, 1000);
    }
    const res = checkRateLimit("ip:new", config, 5000);
    expect(res.allowed).toBe(true);
  });
});
