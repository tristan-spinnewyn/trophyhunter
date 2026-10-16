import type {
  OwnedGame,
  PlatformAccount,
} from "@/lib/types";
import {
  parseSteamIdentifier,
  parseSteamProfile,
  extractGamesFromProfileHtml,
  extractGamesFromBadges,
  extractGamesFromReviews,
  extractGamesFromXml,
} from "./scraper";
import {
  fetchOwnedGamesFromSteamApi,
  resolveMissingGameNamesViaStore,
} from "./webapi";
import type { DiscoveredGameData } from "./types";
import {
  saveUserPlatformAccount,
  saveUserOwnedGames,
} from "@/lib/db";

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

  const headers = {
    Cookie:
      "Steam_Language=french; mature_content=1; birthtime=568022401; lastagecheckage=1-January-1990",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  const [xmlRes, htmlRes, badgesRes, recRes] = await Promise.all([
    fetch(`${baseUrl}/?xml=1`, { headers, next: { revalidate: 60 } }),
    fetch(`${baseUrl}/?l=french`, { headers, next: { revalidate: 60 } }),
    fetch(`${baseUrl}/badges/?l=french`, { headers, next: { revalidate: 120 } }).catch(
      () => null
    ),
    fetch(`${baseUrl}/recommended/?l=french`, {
      headers,
      next: { revalidate: 120 },
    }).catch(() => null),
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
    const error: any = new Error(
      `Profil Steam introuvable pour "${rawUser}". Vérifiez votre SteamID64 ou votre URL personnalisée.`
    );
    error.status = 404;
    throw error;
  }

  const parsed = parseSteamProfile(
    xml,
    html,
    userIdentifier,
    isVanity,
    baseUrl
  );

  const gamesMap = new Map<number, DiscoveredGameData>();
  const upsert = (
    appId: number,
    data: Partial<DiscoveredGameData>
  ) => {
    if (!appId || Number.isNaN(appId)) return;
    const existing = gamesMap.get(appId);
    gamesMap.set(appId, {
      appId,
      name: data.name || existing?.name,
      totalAchievements: Math.max(
        data.totalAchievements ?? 0,
        existing?.totalAchievements ?? 0
      ),
      unlockedCount: Math.max(
        data.unlockedCount ?? 0,
        existing?.unlockedCount ?? 0
      ),
      playtimeHours: data.playtimeHours ?? existing?.playtimeHours,
    });
  };

  // 1. Extract from HTML
  extractGamesFromProfileHtml(html, upsert);

  // 2. Rare showcase items
  for (const item of parsed.rareShowcase) {
    upsert(item.appId, {
      name: item.gameName,
      unlockedCount: 1,
    });
  }

  // 3. Badges
  const badgeCount = extractGamesFromBadges(badgesHtml, upsert);
  if (!parsed.badgesCount && badgeCount > 0) {
    parsed.badgesCount = badgeCount;
  }

  // 4. Reviews
  extractGamesFromReviews(recHtml, upsert);

  // 5. XML most played
  extractGamesFromXml(xml, upsert);

  // 6. Steam Web API (if API key available)
  let gamesOwned = parsed.gamesOwned;
  if (apiKey && parsed.steamId64) {
    const apiCount = await fetchOwnedGamesFromSteamApi(
      apiKey,
      parsed.steamId64,
      upsert
    );
    if (apiCount > 0) {
      gamesOwned = Math.max(gamesOwned, apiCount);
    }
  }

  // 7. Resolve missing names
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
    addedAt: nowIso,
    source: "steam-auto",
  }));

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
      gamesOwned: Math.max(gamesOwned, discoveredGames.length),
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

  return {
    success: true,
    account,
    discoveredGames,
  };
}
