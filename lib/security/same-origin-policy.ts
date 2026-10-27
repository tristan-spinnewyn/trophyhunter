// lib/security/same-origin-policy.ts
import { NextResponse } from "next/server";
import { CsrfOriginError, verifySameOriginRequest } from "./csrf-guard";

const SAFE_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Proxy-level CSRF defense: state-changing requests must come from the app's own origin.
 */
export function enforceSameOriginForMutations(request: Request): NextResponse {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return NextResponse.next();
  }

  try {
    verifySameOriginRequest(request);
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
    }
    throw err;
  }

  return NextResponse.next();
}
