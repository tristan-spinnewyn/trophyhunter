// lib/xbox/openxbl.ts

import type { OwnedGame } from "@/lib/types";
import type { OpenXblPerson, OpenXblProfile, OpenXblTitle } from "./types";

export function unwrapOpenXblPayload<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "content" in raw) {
    const content = (raw as { content: unknown }).content;
    if (content && typeof content === "object") {
      return content as T;
    }
  }
  return (raw ?? {}) as T;
}

export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function parseOpenXblProfile(
  profile?: OpenXblProfile,
  fallbackUser = "",
  person?: OpenXblPerson
) {
  const xuid = profile?.id || person?.xuid || fallbackUser;
  let gamerTag = person?.gamertag || fallbackUser;
  let avatarUrl = person?.displayPicRaw || "";
  let gamerScore = Number(person?.gamerScore) || 0;

  for (const setting of profile?.settings || []) {
    if (setting.id === "Gamertag" && setting.value) gamerTag = setting.value;
    if (setting.id === "GameDisplayPicRaw" && setting.value) avatarUrl = setting.value;
    if (setting.id === "Gamerscore") gamerScore = parseInt(setting.value, 10) || 0;
  }

  return { xuid, gamerTag, avatarUrl, gamerScore };
}

function resolveCoverImage(title: OpenXblTitle): string {
  const rawDisplay = title.displayImage?.trim();
  if (rawDisplay) return rawDisplay.replace(/^http:\/\//i, "https://");
  const rawImg = title.image?.trim();
  if (!rawImg) return "";
  if (/^https?:\/\//i.test(rawImg)) return rawImg.replace(/^http:\/\//i, "https://");
  return `https://images-eds-ssl.xboxlive.com/image?url=${encodeURIComponent(rawImg)}`;
}

export function parseOpenXblTitles(titles: readonly OpenXblTitle[], nowIso: string): {
  discoveredGames: OwnedGame[];
  totalAchievements: number;
  completedGames: number;
  titlesGamerScore: number;
} {
  const discoveredGames: OwnedGame[] = [];
  let totalAchievements = 0;
  let completedGames = 0;
  let titlesGamerScore = 0;

  for (const title of titles) {
    if (!title.titleId || !title.name) continue;
    if (title.type && title.type.toLowerCase() !== "game") continue;

    const achList = Array.isArray(title.achievements) ? title.achievements : null;
    const currentAch =
      title.achievement?.currentAchievements ??
      (achList ? achList.filter((a) => a.isUnlocked || a.progressState === "Achieved").length : 0);
    const rawTotalAch = title.achievement?.totalAchievements ?? (achList ? achList.length : 0);
    const pct = title.achievement?.progressPercentage ?? 0;
    const curGs = title.achievement?.currentGamerscore ?? title.currentGamerscore ?? 0;
    const maxGs = title.achievement?.totalGamerscore ?? title.maxGamerscore ?? 0;

    let totalAch = rawTotalAch;
    if (totalAch === 0 && currentAch > 0) {
      totalAch = pct > 0 ? Math.max(currentAch, Math.round((currentAch * 100) / pct)) : currentAch;
    }

    totalAchievements += currentAch;
    titlesGamerScore += curGs;

    const isCompleted =
      (totalAch > 0 && currentAch >= totalAch) ||
      pct >= 100 ||
      (maxGs > 0 && curGs >= maxGs);
    if (isCompleted) completedGames++;

    const idStr = String(title.titleId);
    const rawId = parseInt(idStr, 10) || Math.abs(hashCode(idStr));
    discoveredGames.push({
      appId: rawId,
      name: title.name,
      headerImg: resolveCoverImage(title),
      platform: "xbox",
      totalAchievements: totalAch,
      unlockedCount: currentAch,
      addedAt: nowIso,
      source: "manual",
    });
  }

  return { discoveredGames, totalAchievements, completedGames, titlesGamerScore };
}
