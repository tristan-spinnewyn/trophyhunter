// __tests__/helpers/profileRequests.ts
import type { PlatformType } from "@/lib/types";

/** Builds the POST request the accounts page sends to /api/profile/<platform>. */
export function profileSyncRequest(
  platform: PlatformType,
  body: { user?: string; secret?: string } = {},
  headers: Record<string, string> = {}
): Request {
  return new Request(`http://localhost:3000/api/profile/${platform}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
