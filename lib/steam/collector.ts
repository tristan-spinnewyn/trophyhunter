// lib/steam/collector.ts
import type { OwnedGame } from "@/lib/types";
import type { DiscoveredGameData, SteamParsedProfile } from "./types";
import {
  extractGamesFromProfileHtml,
  extractGamesFromBadges,
  extractGamesFromReviews,
  extractGamesFromXml,
} from "./scraper";
import { fetchOwnedGamesFromSteamApi, resolveMissingGameNamesViaStore } from "./webapi";
import type { RawSteamProfileResponses } from "./fetcher";

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
    addedAt: nowIso,
    source: "steam-auto",
  }));

  return { discoveredGames, gamesOwned: Math.max(gamesOwned, discoveredGames.length) };
}
