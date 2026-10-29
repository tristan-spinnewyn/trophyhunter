// lib/accounts/platform-api-key.ts
import { getUserPlatformApiKey } from "@/lib/db";

type KeyedPlatform = "steam" | "xbox";

/** Server-wide keys configured by the owner of the instance, in lookup order. */
const SERVER_KEY_VARIABLES: Readonly<Record<KeyedPlatform, readonly string[]>> = {
  steam: ["STEAM_API_KEY"],
  xbox: ["OPENXBL_API_KEY", "XBL_API_KEY", "XBOX_API_KEY"],
};

function readServerKey(platform: KeyedPlatform): string {
  for (const variable of SERVER_KEY_VARIABLES[platform]) {
    const value = process.env[variable]?.trim();
    if (value) return value;
  }
  return "";
}

/**
 * Picks the API key for a platform call: the key the caller provided, then the
 * signed-in user's stored key, then the server key. The server key is reserved for
 * signed-in users so anonymous callers cannot spend the owner's quota or read their data.
 */
export function resolvePlatformApiKey(
  platform: KeyedPlatform,
  { userId, providedKey }: { userId: string | undefined; providedKey?: string }
): string {
  if (providedKey) return providedKey;
  if (!userId) return "";
  return getUserPlatformApiKey(userId, platform) || readServerKey(platform);
}
