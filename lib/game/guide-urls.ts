// lib/game/guide-urls.ts

import { cleanTitleForSearch } from "@/lib/steam/game-metadata";

export function buildPsthcGuideUrl(gameName: string): string {
  const cleanName = cleanTitleForSearch(gameName).trim();
  const query = cleanName.length > 0 ? cleanName : gameName.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(`site:psthc.fr ${query} guide`)}`;
}

export function buildGuideUrls(gameName: string, achievementName: string, gameId: number) {
  const cleanQuery = encodeURIComponent(`${gameName} ${achievementName} succès trophée guide fr`);
  return {
    youtubeUrl: `https://www.youtube.com/results?search_query=${cleanQuery}`,
    psthcUrl: buildPsthcGuideUrl(gameName),
    steamGuidesUrl: `https://steamcommunity.com/app/${gameId}/guides/?requiredtags[]=Achievements`,
  };
}
