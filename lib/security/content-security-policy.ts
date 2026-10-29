// lib/security/content-security-policy.ts

/**
 * The Content-Security-Policy sent with every page.
 *
 * script-src keeps 'unsafe-inline' because Next.js inlines its bootstrap scripts; a nonce
 * would remove it but force every page to render dynamically. The policy still limits an
 * injected script: it cannot load code from another host, and connect-src / form-action keep
 * every request on this server, so stolen data has nowhere to go.
 */
export function buildContentSecurityPolicy({ isDevelopment }: { isDevelopment: boolean }): string {
  const scriptSources = ["'self'", "'unsafe-inline'", ...(isDevelopment ? ["'unsafe-eval'"] : [])];

  const directives: Record<string, readonly string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSources,
    // React renders style attributes and Tailwind injects styles at runtime.
    "style-src": ["'self'", "'unsafe-inline'"],
    // Covers and avatars come from many store CDNs (Steam, Epic, GOG, Xbox...).
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...(isDevelopment ? ["ws:"] : [])],
    // canvas-confetti animates in a worker created from a blob URL; without this it fails silently.
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}
