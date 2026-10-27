// lib/security/csrf-guard.ts
export class CsrfOriginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsrfOriginError";
  }
}

export function verifySameOriginRequest(request: Request): void {
  const originHeader = request.headers.get("origin");
  // Browsers cannot forge X-Forwarded-Host in a cross-site request, so trusting it here is safe.
  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (!originHeader || !hostHeader) {
    throw new CsrfOriginError("Missing Origin or Host header");
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(originHeader);
  } catch {
    throw new CsrfOriginError("Malformed Origin header");
  }

  if (parsedOrigin.host.toLowerCase() !== hostHeader.toLowerCase()) {
    throw new CsrfOriginError("Cross-origin state-changing request denied");
  }
}
