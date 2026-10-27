// __tests__/helpers/responses.ts
import { networkGuard, requestUrl } from "./networkGuard";

export function jsonResponse<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function textResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * Fetch fallback for the optional third-party lookups a profile sync makes after
 * the requests a test cares about: Epic GraphQL returns no data and the Steam
 * store search finds no match. Use it as the spy's default implementation, after
 * its mockResolvedValueOnce chain. Any other URL is still blocked by the guard.
 */
export function emptyThirdPartyResponse(input: RequestInfo | URL): Promise<Response> {
  const url = requestUrl(input);
  if (/^https:\/\/(launcher\.store|graphql)\.epicgames\.com\/graphql/.test(url)) {
    return Promise.resolve(jsonResponse({ data: {} }));
  }
  if (url.startsWith("https://store.steampowered.com/api/storesearch/")) {
    return Promise.resolve(jsonResponse({ total: 0, items: [] }));
  }
  return networkGuard.fetch(input);
}
