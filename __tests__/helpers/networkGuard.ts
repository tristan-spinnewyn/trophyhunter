// __tests__/helpers/networkGuard.ts

export interface NetworkGuard {
  /** Drop-in replacement for the global fetch that never reaches the network. */
  fetch: typeof fetch;
  /** Returns the URLs blocked since the last call, and forgets them. */
  takeBlockedUrls(): string[];
}

export function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/**
 * Builds a fetch that rejects every request and records its URL.
 * Production code often swallows fetch errors, so callers check the
 * recorded URLs to make an unmocked request fail the test.
 */
export function createNetworkGuard(): NetworkGuard {
  let blocked: string[] = [];

  const guardFetch = async (input: RequestInfo | URL): Promise<Response> => {
    const url = requestUrl(input);
    blocked.push(url);
    throw new Error(`Real network call blocked in tests: ${url}`);
  };

  return {
    fetch: guardFetch as typeof fetch,
    takeBlockedUrls() {
      const urls = blocked;
      blocked = [];
      return urls;
    },
  };
}

/** The guard installed as the global fetch by the blockNetwork setup file. */
export const networkGuard = createNetworkGuard();
