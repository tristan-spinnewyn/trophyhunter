// lib/accounts/profile-sync-client.ts
// Client-safe: used by the platform sync hooks in the browser.

import type { PlatformType } from "@/lib/types";

export interface ProfileSyncBody {
  readonly user: string;
  readonly secret?: string;
}

/**
 * Starts a profile sync. It is a POST with a JSON body so the sync is covered by the
 * same-origin check and the platform secret never appears in a URL.
 */
export function postProfileSync(
  platform: PlatformType,
  body: ProfileSyncBody,
  extraHeaders: Record<string, string> = {}
): Promise<Response> {
  return fetch(`/api/profile/${platform}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });
}
