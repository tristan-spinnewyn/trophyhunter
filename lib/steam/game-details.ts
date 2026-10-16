// lib/steam/game-details.ts
import type { GameDetails } from "@/lib/types";
import { getDb } from "@/lib/db";
import {
  MISSABLE_KEYWORDS,
  isLikelyMissable,
  cleanTitleForSearch,
  normalizeForComparison,
  findBestSteamMatch,
} from "./game-details-utils";
import {
  fetchSteamAchievementsByAppId,
  searchSteamStoreFallback,
  type AchFetchResult,
} from "./game-details-fetcher";
import { parseAchievementsResult } from "./game-details-parser";

export {
  MISSABLE_KEYWORDS,
  isLikelyMissable,
  cleanTitleForSearch,
  normalizeForComparison,
  findBestSteamMatch,
  fetchSteamAchievementsByAppId,
};

export interface GetGameDetailsOptions {
  appId: string;
  nameParam?: string | null;
  fastMode?: boolean;
  authUserId?: string;
}

export async function getSteamGameDetails({
  appId,
  nameParam,
  fastMode = false,
  authUserId,
}: GetGameDetailsOptions): Promise<GameDetails> {
  let achResult: AchFetchResult = null;
  let gameInfo: any = null;
  let effectiveAppId = appId;
  let matchedSearchImage = "";

  if (!fastMode || !nameParam) {
    const [storeData, initialAchResult] = await Promise.all([
      fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=french&cc=fr`, {
        headers: { "Accept-Language": "fr-FR,fr;q=0.9" },
        next: { revalidate: 3600 },
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetchSteamAchievementsByAppId(appId),
    ]);
    achResult = initialAchResult;
    gameInfo = storeData?.[appId]?.data;
  }

  if (!gameInfo && nameParam) {
    const fallback = await searchSteamStoreFallback(nameParam, fastMode);
    if (fallback.matchedAppId) {
      effectiveAppId = fallback.matchedAppId;
      matchedSearchImage = fallback.matchedImage || "";
      if (fallback.gameInfo) gameInfo = fallback.gameInfo;
      if (fallback.achResult) achResult = fallback.achResult;
    }
  }

  const gameName = gameInfo?.name || nameParam || `Jeu (#${appId})`;
  const headerImg =
    gameInfo?.header_image ||
    matchedSearchImage ||
    `https://cdn.akamai.steamstatic.com/steam/apps/${effectiveAppId}/header.jpg`;

  const achievements = parseAchievementsResult(achResult, effectiveAppId);

  if (achievements.length > 0 && authUserId) {
    try {
      getDb()
        .prepare("UPDATE user_games SET total_achievements = ? WHERE user_id = ? AND app_id = ?")
        .run(achievements.length, authUserId, parseInt(appId, 10));
    } catch {}
  }

  const cleanName = cleanTitleForSearch(gameName);
  return {
    id: parseInt(appId, 10),
    name: gameName,
    headerImg,
    shortDesc: gameInfo?.short_description || "",
    developers: gameInfo?.developers || [],
    publishers: gameInfo?.publishers || [],
    totalAchievements: achievements.length,
    achievements,
    guideLinks: {
      steamGuidesUrl: effectiveAppId ? `https://steamcommunity.com/app/${effectiveAppId}/guides/?requiredtags[]=Achievements` : "",
      psthcUrl: `https://www.psthc.fr/recherche.html?q=${encodeURIComponent(cleanName)}`,
      youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanName + " succes trophée fr")}`,
    },
  };
}
