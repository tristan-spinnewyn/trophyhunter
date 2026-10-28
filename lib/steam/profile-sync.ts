// lib/steam/profile-sync.ts
import type { OwnedGame, PlatformAccount } from "@/lib/types";
import { saveUserPlatformAccount, saveUserOwnedGames } from "@/lib/db";
import {
  extractGamesFromBadges,
  extractGamesFromProfileHtml,
  extractGamesFromReviews,
  extractGamesFromXml,
  parseSteamIdentifier,
  parseSteamProfile,
} from "./profile-scraper";
import { fetchOwnedGamesFromSteamApi, resolveMissingGameNamesViaStore } from "./store-api";
import type { DiscoveredGameData, SteamParsedProfile } from "./types";

export interface RawSteamProfileResponses {
  xml: string;
  html: string;
  badgesHtml: string;
  recHtml: string;
}

export async function fetchRawSteamProfilePages(baseUrl: string, rawUser: string): Promise<RawSteamProfileResponses> {
  const headers = {
    Cookie: "Steam_Language=french; mature_content=1; birthtime=568022401; lastagecheckage=1-January-1990",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  const [xmlRes, htmlRes, badgesRes, recRes] = await Promise.all([
    fetch(`${baseUrl}/?xml=1`, { headers, next: { revalidate: 60 } }),
    fetch(`${baseUrl}/?l=french`, { headers, next: { revalidate: 60 } }),
    fetch(`${baseUrl}/badges/?l=french`, { headers, next: { revalidate: 120 } }).catch(() => null),
    fetch(`${baseUrl}/recommended/?l=french`, { headers, next: { revalidate: 120 } }).catch(() => null),
  ]);

  if (!htmlRes.ok) {
    const error: any = new Error(`Impossible de joindre le profil Steam (${htmlRes.status}).`);
    error.status = htmlRes.status;
    throw error;
  }

  const [xml, html, badgesHtml, recHtml] = await Promise.all([
    xmlRes.ok ? xmlRes.text() : Promise.resolve(""),
    htmlRes.text(),
    badgesRes && badgesRes.ok ? badgesRes.text() : Promise.resolve(""),
    recRes && recRes.ok ? recRes.text() : Promise.resolve(""),
  ]);

  if (
    html.includes("The specified profile could not be found") ||
    html.includes("Profil introuvable") ||
    xml.includes("The specified profile could not be found")
  ) {
    const error: any = new Error(`Profil Steam introuvable pour "${rawUser}". Vérifiez votre SteamID64 ou votre URL personnalisée.`);
    error.status = 404;
    throw error;
  }

  return { xml, html, badgesHtml, recHtml };
}

export async function collectSteamGames(
  raw: RawSteamProfileResponses,
  parsed: SteamParsedProfile,
  apiKey?: string
): Promise<{ discoveredGames: OwnedGame[]; gamesOwned: number }> {
  const gamesMap = new Map<number, DiscoveredGameData>();
  const upsert = (appId: number, data: Partial<DiscoveredGameData>) => {
    if (!appId || Number.isNaN(appId)) return;
    const existing = gamesMap.get(appId);
    gamesMap.set(appId, {
      appId,
      name: data.name || existing?.name,
      totalAchievements: Math.max(data.totalAchievements ?? 0, existing?.totalAchievements ?? 0),
      unlockedCount: Math.max(data.unlockedCount ?? 0, existing?.unlockedCount ?? 0),
      playtimeHours: data.playtimeHours ?? existing?.playtimeHours,
      lastPlayed: data.lastPlayed ?? existing?.lastPlayed,
    });
  };

  extractGamesFromProfileHtml(raw.html, upsert);
  for (const item of parsed.rareShowcase) {
    upsert(item.appId, { name: item.gameName, unlockedCount: 1 });
  }

  const badgeCount = extractGamesFromBadges(raw.badgesHtml, upsert);
  if (!parsed.badgesCount && badgeCount > 0) {
    parsed.badgesCount = badgeCount;
  }

  extractGamesFromReviews(raw.recHtml, upsert);
  extractGamesFromXml(raw.xml, upsert);

  let gamesOwned = parsed.gamesOwned;
  if (apiKey && parsed.steamId64) {
    const apiCount = await fetchOwnedGamesFromSteamApi(apiKey, parsed.steamId64, upsert);
    if (apiCount > 0) gamesOwned = Math.max(gamesOwned, apiCount);
  }

  const gameEntries = Array.from(gamesMap.values());
  await resolveMissingGameNamesViaStore(gameEntries);

  const nowIso = new Date().toISOString();
  const discoveredGames: OwnedGame[] = gameEntries.map((g) => ({
    appId: g.appId,
    name: g.name || `Jeu Steam #${g.appId}`,
    headerImg: `https://cdn.akamai.steamstatic.com/steam/apps/${g.appId}/header.jpg`,
    platform: "steam",
    totalAchievements: g.totalAchievements,
    unlockedCount: g.unlockedCount,
    playtimeHours: g.playtimeHours,
    lastPlayed: g.lastPlayed,
    addedAt: nowIso,
    source: "steam-auto",
  }));

  return { discoveredGames, gamesOwned: Math.max(gamesOwned, discoveredGames.length) };
}

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
