// lib/xbox/game-details.ts

import type { Achievement, OwnedGame } from "@/lib/types";
import { getDb, getUserPlatformAccounts, getUserPlatformApiKey, saveUserGameProgress } from "@/lib/db";
import { isLikelyMissable, normalizeForComparison } from "@/lib/steam/game-metadata";
import { searchSteamStoreFallback } from "@/lib/steam/store-api";
import type { OpenXblAchievementItem, OpenXblProfilePayload, OpenXblTitle, OpenXblTitleAchievementsPayload } from "./types";
import { isXboxAchievementUnlocked, parseOpenXblProfile, unwrapOpenXblPayload } from "./openxbl";

function mapXboxItemToAchievement(item: OpenXblAchievementItem, index: number): { ach: Achievement; unlocked: boolean } {
  const name = item.name?.trim() || `Succès #${index + 1}`;
  const desc = item.description?.trim() || item.lockedDescription?.trim() || "";
  const rawIcon = item.mediaAssets?.[0]?.url || item.imageUnlocked || item.icon || "";
  return {
    ach: {
      id: String(item.id ?? `xbox_${index}`),
      name,
      desc,
      icon: rawIcon ? rawIcon.replace(/^http:\/\//i, "https://") : "",
      percent: Number(item.rarity?.currentPercentage) || 0,
      hidden: Boolean(item.isSecret),
      missable: isLikelyMissable(name, desc),
    },
    unlocked: isXboxAchievementUnlocked(item),
  };
}

export async function fetchXboxTitleAchievements(
  xuid: string,
  titleId: string | number,
  headers: Record<string, string>
): Promise<{ items: readonly OpenXblAchievementItem[]; totalCount: number }> {
  const encodedTitle = encodeURIComponent(String(titleId));
  const urls = [
    ...(xuid && /^\d{12,22}$/.test(xuid)
      ? [`https://api.xbl.io/v2/achievements/player/${encodeURIComponent(xuid)}/${encodedTitle}?maxItems=200`]
      : []),
    `https://api.xbl.io/v2/achievements/title/${encodedTitle}?maxItems=200`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers, next: { revalidate: 120 } });
      if (!res.ok) continue;
      const payload = unwrapOpenXblPayload<OpenXblTitleAchievementsPayload>(await res.json());
      const items = Array.isArray(payload?.achievements) ? payload.achievements : [];
      const totalCount = payload?.pagingInfo?.totalRecords || items.length;
      if (totalCount > 0 || items.length > 0) return { items, totalCount: Math.max(totalCount, items.length) };
    } catch (err: unknown) {
      if (err instanceof Error) continue;
    }
  }
  return { items: [], totalCount: 0 };
}

export async function enrichXboxGamesTotals(
  games: OwnedGame[],
  rawTitles: readonly OpenXblTitle[],
  xuid: string,
  headers: Record<string, string>
): Promise<void> {
  const targets = games.filter((_, idx) => !(rawTitles[idx]?.achievement?.totalAchievements));
  await Promise.all(
    targets.slice(0, 15).map(async (game) => {
      const { totalCount } = await fetchXboxTitleAchievements(xuid, game.appId, headers);
      if (totalCount > (game.unlockedCount || 0)) {
        game.totalAchievements = totalCount;
        return;
      }
      const steam = await searchSteamStoreFallback(game.name, false);
      if (steam.achResult?.type === "schema" && steam.achResult.list.length > (game.unlockedCount || 0)) {
        game.totalAchievements = steam.achResult.list.length;
      }
    })
  );
}

export async function getXboxAchievementsForUser(
  userId: string | undefined,
  appId: number,
  fallbackAchievements: Achievement[] = []
): Promise<{ achievements: Achievement[]; unlockedIds: string[] } | null> {
  const apiKey =
    (userId ? getUserPlatformApiKey(userId, "xbox") : null) ||
    process.env.OPENXBL_API_KEY?.trim() ||
    process.env.XBL_API_KEY?.trim() ||
    process.env.XBOX_API_KEY?.trim() ||
    "";
  if (!apiKey) return null;

  const headers = { "X-Authorization": apiKey, Accept: "application/json", "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8" };
  let xuid = userId ? getUserPlatformAccounts(userId).xbox?.username || "" : "";
  if (!/^\d{12,22}$/.test(xuid)) {
    const selfRes = await fetch("https://api.xbl.io/v2/account", { headers, next: { revalidate: 120 } }).catch(() => null);
    if (selfRes?.ok) {
      const selfPayload = unwrapOpenXblPayload<OpenXblProfilePayload>(await selfRes.json());
      xuid = parseOpenXblProfile(selfPayload?.profileUsers?.[0], xuid, selfPayload?.people?.[0]).xuid;
    }
  }

  const { items, totalCount } = await fetchXboxTitleAchievements(xuid, appId, headers);
  if (items.length === 0) return null;

  const mapped = items.map(mapXboxItemToAchievement);
  const unlockedNames = new Set(mapped.filter((m) => m.unlocked).map((m) => normalizeForComparison(m.ach.name)));
  const useFallback = fallbackAchievements.length > mapped.length;
  const achievements = useFallback ? fallbackAchievements : mapped.map((m) => m.ach);
  const unlockedIds = useFallback
    ? fallbackAchievements.filter((a) => unlockedNames.has(normalizeForComparison(a.name))).map((a) => a.id)
    : mapped.filter((m) => m.unlocked).map((m) => m.ach.id);

  if (userId) {
    saveUserGameProgress(userId, appId, "xbox", { unlockedIds, notes: {} });
    getDb()
      .prepare("UPDATE user_games SET total_achievements = ?, unlocked_count = ? WHERE user_id = ? AND app_id = ? AND platform = 'xbox'")
      .run(Math.max(achievements.length, totalCount), unlockedIds.length, userId, appId);
  }
  return { achievements, unlockedIds };
}
