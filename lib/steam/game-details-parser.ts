// lib/steam/game-details-parser.ts
import type { Achievement } from "@/lib/types";
import { isLikelyMissable } from "./game-details-utils";
import { stripHtmlTags } from "./sync";
import type { AchFetchResult } from "./game-details-fetcher";

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
      const percent = parseFloat(item.player_percent_unlocked) || 0;
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
