// lib/steam/game-details.ts
import type { Achievement, GameDetails } from "@/lib/types";
import { getDb } from "@/lib/db";
import { buildPsthcGuideUrl } from "@/lib/game/guide-urls";
import { cleanTitleForSearch, isLikelyMissable } from "./game-metadata";
import { stripHtmlTags } from "./html";
import { fetchSteamAchievementsByAppId, searchSteamStoreFallback, type AchFetchResult } from "./store-api";
import type { SteamStoreGameInfo } from "./types";

export function parseAchievementsResult(achResult: AchFetchResult, effectiveAppId: string): Achievement[] {
  const achievements: Achievement[] = [];

  if (achResult?.type === "schema" && achResult.list.length > 0) {
    const officialList = achResult.list;
    for (let i = 0; i < officialList.length; i++) {
      const item = officialList[i];
      const title = item.localized_name || item.internal_name || `Succès #${i + 1}`;
      const rawDesc = item.localized_desc || "";
      const isHidden = !!item.hidden;
      const displayDesc = rawDesc || (isHidden ? "Succès secret (Masqué par le jeu)" : "");
      const percent = parseFloat(String(item.player_percent_unlocked ?? "")) || 0;
      const icon = item.icon
        ? (item.icon.startsWith("http")
            ? item.icon
            : `https://shared.fastly.steamstatic.com/community_assets/images/apps/${effectiveAppId}/${item.icon}`)
        : "";
      const missable = isLikelyMissable(title, displayDesc);
      const idSlug = `ach_${i + 1}_${title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`;

      achievements.push({ id: idSlug, name: title, desc: displayDesc, icon, percent, hidden: isHidden, missable });
    }
  } else if (achResult?.type === "html" && achResult.html) {
    const parts = achResult.html.split(/<div[^>]*class="[^"]*achieveRow[^"]*"[^>]*>/);
    for (let i = 1; i < parts.length; i++) {
      const chunk = parts[i];
      const imgMatch = chunk.match(/<img[^>]*src="([^"]+)"/);
      const titleMatch = chunk.match(/<h3[^>]*>(.*?)<\/h3>/);
      const descMatch = chunk.match(/<h5[^>]*>(.*?)<\/h5>/);
      const percentMatch = chunk.match(/<div class="achievePercent">([^<]+)<\/div>/);

      const title = titleMatch ? stripHtmlTags(titleMatch[1]) : `Succès #${i}`;
      const rawDesc = descMatch ? stripHtmlTags(descMatch[1]) : "";
      const percent = parseFloat(percentMatch ? percentMatch[1].replace("%", "").trim() : "0") || 0;
      const icon = imgMatch ? imgMatch[1] : "";
      const isHidden = !rawDesc || rawDesc.length === 0;
      const displayDesc = isHidden ? "Succès secret (Masqué par le jeu)" : rawDesc;
      const missable = isLikelyMissable(title, displayDesc);
      const idSlug = `ach_${i}_${title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`;

      achievements.push({ id: idSlug, name: title, desc: displayDesc, icon, percent, hidden: isHidden, missable });
    }
  }

  return achievements;
}

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
  let gameInfo: SteamStoreGameInfo | null | undefined = null;
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
      psthcUrl: buildPsthcGuideUrl(cleanName),
      youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanName + " succes trophée fr")}`,
    },
  };
}
