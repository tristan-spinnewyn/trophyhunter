// lib/steam/service.ts
import type { OwnedGame, PlatformAccount } from "@/lib/types";
import { parseSteamIdentifier, parseSteamProfile } from "./scraper";
import { saveUserPlatformAccount, saveUserOwnedGames } from "@/lib/db";
import { fetchRawSteamProfilePages } from "./fetcher";
import { collectSteamGames } from "./collector";

export interface SteamSyncResult {
  success: boolean;
  account: PlatformAccount;
  discoveredGames: OwnedGame[];
}

export async function syncSteamProfile(
  rawUser: string,
  apiKey?: string,
  authUserId?: string
): Promise<SteamSyncResult> {
  const { userIdentifier, isVanity, baseUrl } = parseSteamIdentifier(rawUser);
  const rawPages = await fetchRawSteamProfilePages(baseUrl, rawUser);
  const parsed = parseSteamProfile(rawPages.xml, rawPages.html, userIdentifier, isVanity, baseUrl);

  const { discoveredGames, gamesOwned } = await collectSteamGames(rawPages, parsed, apiKey);
  const nowIso = new Date().toISOString();

  const account: PlatformAccount = {
    platform: "steam",
    username: parsed.steamId64 || userIdentifier,
    displayName: parsed.personaName,
    avatarUrl: parsed.avatarFull,
    profileUrl: baseUrl,
    level: parsed.level,
    onlineState: parsed.onlineState,
    memberSince: parsed.memberSince,
    location: parsed.location,
    connectedAt: nowIso,
    lastSyncedAt: nowIso,
    stats: {
      gamesOwned,
      totalAchievements: parsed.totalAchievements,
      completedGames: parsed.completedGames,
      hoursPlayed: parsed.hoursPlayed2Wk,
      badges: parsed.badgesCount,
      dlcCount: parsed.dlcCount,
      wishlistCount: parsed.wishlistCount,
    },
    rareShowcase: parsed.rareShowcase.slice(0, 6),
  };

  if (authUserId) {
    try {
      saveUserPlatformAccount(authUserId, account, apiKey || undefined);
      if (discoveredGames.length > 0) {
        saveUserOwnedGames(authUserId, discoveredGames);
      }
    } catch (saveErr) {
      console.warn("Could not auto-persist Steam data to database:", saveErr);
    }
  }

  return { success: true, account, discoveredGames };
}
