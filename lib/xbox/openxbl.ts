// lib/xbox/openxbl.ts

import type { OwnedGame } from "@/lib/types";
import type { OpenXblProfile, OpenXblTitle } from "./types";

export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function parseOpenXblProfile(profile?: OpenXblProfile, fallbackUser = "") {
  let xuid = profile?.id || fallbackUser;
  let gamerTag = fallbackUser;
  let avatarUrl = "";
  let gamerScore = 0;

  for (const setting of profile?.settings || []) {
    if (setting.id === "Gamertag") gamerTag = setting.value;
    if (setting.id === "GameDisplayPicRaw") avatarUrl = setting.value;
    if (setting.id === "Gamerscore") gamerScore = parseInt(setting.value, 10) || 0;
  }

  return { xuid, gamerTag, avatarUrl, gamerScore };
}

export function parseOpenXblTitles(titles: OpenXblTitle[], nowIso: string): {
  discoveredGames: OwnedGame[];
  totalAchievements: number;
  completedGames: number;
} {
  const discoveredGames: OwnedGame[] = [];
  let totalAchievements = 0;
  let completedGames = 0;

  for (const title of titles) {
    if (!title.titleId || !title.name) continue;
    const totalAch = title.achievement?.totalAchievements || 0;
    const currentAch = title.achievement?.currentAchievements || 0;

    totalAchievements += currentAch;
    if (totalAch > 0 && currentAch >= totalAch) completedGames++;

    const rawId = parseInt(title.titleId, 10) || Math.abs(hashCode(String(title.titleId)));
    discoveredGames.push({
      appId: rawId,
      name: title.name,
      headerImg:
        title.displayImage ||
        `https://images-eds-ssl.xboxlive.com/image?url=${encodeURIComponent(title.image || "")}`,
      platform: "xbox",
      totalAchievements: totalAch,
      unlockedCount: currentAch,
      addedAt: nowIso,
      source: "manual",
    });
  }

  return { discoveredGames, totalAchievements, completedGames };
}
