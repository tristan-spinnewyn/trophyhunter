// lib/security/anonymous-rate-limit.ts
import { NextResponse } from "next/server";
import { checkRateLimit, extractClientKey } from "./rate-limiter";
import type { RateLimitConfig } from "./security.types";

/** One budget shared by every public route, so an anonymous client cannot spread its calls across them. */
export const ANONYMOUS_RATE_LIMIT_SCOPE = "anonymous_api";
export const ANONYMOUS_RATE_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 30 };

/**
 * Public routes call Steam, Epic, GOG, Xbox and Microsoft on the caller's behalf. Anonymous callers
 * get a small per-IP budget so the server cannot be used as a free relay; signed-in users are never
 * limited here, since a library sync legitimately makes hundreds of calls.
 * Returns the 429 response to send, or null when the request may proceed.
 */
export function anonymousRateLimitResponse(request: Request, isSignedIn: boolean): NextResponse | null {
  if (isSignedIn) return null;

  const result = checkRateLimit(extractClientKey(request, ANONYMOUS_RATE_LIMIT_SCOPE), ANONYMOUS_RATE_LIMIT);
  if (result.allowed) return null;

  return NextResponse.json(
    { error: "Trop de requêtes. Connectez-vous ou réessayez dans une minute." },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
  );
}
