// lib/accounts/server-sync.ts
import { getUserById, getUserPlatformAccounts, getUserPlatformApiKey } from "@/lib/db";
import type { PlatformAccount, PlatformType } from "@/lib/types";
import { resolvePlatformApiKey } from "./platform-api-key";
import { syncSteamProfile } from "@/lib/steam/profile-sync";
import { fetchGogProfile } from "@/lib/gog/service";
import { persistGogSync } from "@/lib/gog/persist-sync";
import { fetchXboxProfileLive } from "@/lib/xbox/service";
import { persistXboxSync } from "@/lib/xbox/persist-sync";
import { syncEpicProfileWithOAuth } from "@/lib/epic/profile-sync";
import { loadStoredEpicCredentials } from "@/lib/epic/credentials";

export type PlatformSyncOutcome =
  | { readonly platform: PlatformType; readonly status: "synced" | "skipped" }
  | { readonly platform: PlatformType; readonly status: "failed"; readonly error: string };

type ServerSyncer = (userId: string, account: PlatformAccount) => Promise<"synced" | "skipped">;

class PlatformRefusedError extends Error {}

/**
 * How each platform syncs without the user at the keyboard, from what is stored for them.
 * Keys are never written back: the stored ones stay, server keys never land in a user record.
 */
const SERVER_SYNCERS: Readonly<Record<PlatformType, ServerSyncer>> = {
  steam: async (userId, account) => {
    await syncSteamProfile(account.username, resolvePlatformApiKey("steam", { userId }), userId);
    return "synced";
  },
  gog: async (userId, account) => {
    const token = getUserPlatformApiKey(userId, "gog") ?? undefined;
    persistGogSync(userId, await fetchGogProfile(account.username, token));
    return "synced";
  },
  xbox: async (userId, account) => {
    const apiKey = resolvePlatformApiKey("xbox", { userId });
    if (!apiKey) return "skipped";
    persistXboxSync(userId, await fetchXboxProfileLive(account.username, apiKey, new Date().toISOString()));
    return "synced";
  },
  epic: async (userId) => {
    const user = getUserById(userId);
    if (!user || !loadStoredEpicCredentials(userId)) return "skipped";
    const result = await syncEpicProfileWithOAuth("", undefined, user);
    if (!result.success) throw new PlatformRefusedError(result.error);
    return "synced";
  },
};

/** Syncs every platform the user connected, one after the other; a failing platform does not stop the others. */
export async function syncUserPlatforms(userId: string): Promise<PlatformSyncOutcome[]> {
  const accounts = Object.values(getUserPlatformAccounts(userId));
  const outcomes: PlatformSyncOutcome[] = [];
  for (const account of accounts) {
    try {
      outcomes.push({ platform: account.platform, status: await SERVER_SYNCERS[account.platform](userId, account) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Automatic ${account.platform} sync failed:`, message);
      outcomes.push({ platform: account.platform, status: "failed", error: message });
    }
  }
  return outcomes;
}
