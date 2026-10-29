// __tests__/security/anonymous-rate-limit.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  ANONYMOUS_RATE_LIMIT,
  anonymousRateLimitResponse,
} from "@/lib/security/anonymous-rate-limit";
import { resetRateLimiterForTesting } from "@/lib/security";

function fromIp(ip: string): Request {
  return new Request("http://localhost/api/search?q=portal", { headers: { "x-forwarded-for": ip } });
}

describe("anonymousRateLimitResponse", () => {
  beforeEach(() => resetRateLimiterForTesting());

  it("lets an anonymous caller through until the budget is spent, then answers 429", async () => {
    for (let i = 0; i < ANONYMOUS_RATE_LIMIT.maxRequests; i++) {
      expect(anonymousRateLimitResponse(fromIp("203.0.113.7"), false)).toBeNull();
    }

    const blocked = anonymousRateLimitResponse(fromIp("203.0.113.7"), false);
    expect(blocked?.status).toBe(429);
    expect(Number(blocked?.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect((await blocked!.json()).error).toContain("Trop de requêtes");
  });

  it("counts each IP separately", () => {
    for (let i = 0; i < ANONYMOUS_RATE_LIMIT.maxRequests; i++) anonymousRateLimitResponse(fromIp("203.0.113.7"), false);

    expect(anonymousRateLimitResponse(fromIp("198.51.100.4"), false)).toBeNull();
  });

  it("never limits a signed-in user, whose library sync makes hundreds of calls", () => {
    for (let i = 0; i < ANONYMOUS_RATE_LIMIT.maxRequests * 3; i++) {
      expect(anonymousRateLimitResponse(fromIp("203.0.113.7"), true)).toBeNull();
    }
  });
});
