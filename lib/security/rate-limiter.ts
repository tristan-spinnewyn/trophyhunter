// lib/security/rate-limiter.ts
import type { RateLimitConfig, RateLimitResult } from "./security.types";

interface BucketEntry {
  readonly count: number;
  readonly resetAt: number;
}

const buckets = new Map<string, BucketEntry>();
const MAX_BUCKETS = 5000;

export function extractClientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const rawIp = forwarded ? forwarded.split(",")[0].trim() : realIp?.trim() || "local";
  return `${scope}:${rawIp}`;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  nowMs = Date.now()
): RateLimitResult {
  if (buckets.size >= MAX_BUCKETS) {
    for (const [k, v] of buckets.entries()) {
      if (v.resetAt <= nowMs) {
        buckets.delete(k);
      }
    }
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= nowMs) {
    const resetAt = nowMs + config.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - 1),
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - nowMs) / 1000)),
    };
  }

  const nextCount = current.count + 1;
  buckets.set(key, { count: nextCount, resetAt: current.resetAt });

  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - nextCount),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - nowMs) / 1000)),
  };
}

export function resetRateLimiterForTesting(): void {
  buckets.clear();
}
