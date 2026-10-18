// lib/gog/games.services.ts
import type { OwnedGame } from "@/lib/types";
import type {
  GogPublicGameItem,
  GogPublicGamesPageResponse,
  GogUserGameStatEntry,
} from "./gog.types";
import { normalizeGogImageUrl } from "./identifier.services";
import { parseGogGameAchievementsHtml } from "./parser.services";

function extractUserStat(
  stats: GogPublicGameItem["stats"],
  userId: string
): GogUserGameStatEntry | undefined {
  if (!stats || Array.isArray(stats)) return undefined;
  const record = stats as Readonly<Record<string, GogUserGameStatEntry>>;
  return (userId ? record[userId] : undefined) ?? Object.values(record)[0];
}

export async function fetchGogPublicGames(
  username: string,
  userId: string,
  headers: Readonly<Record<string, string>>,
  nowIso: string,
  fallbackItems: readonly GogPublicGameItem[] = []
): Promise<{
  readonly games: OwnedGame[];
  readonly gameProgress: Record<number, readonly string[]>;
  readonly completedGamesCount: number;
}> {
  const allItems: GogPublicGameItem[] = [];
  const baseStatsUrl = `https://www.gog.com/u/${encodeURIComponent(username)}/games/stats?sort=recent_playtime&order=desc`;
  try {
    const firstRes = await fetch(`${baseStatsUrl}&page=1`, { headers, next: { revalidate: 120 } });
    if (firstRes.ok) {
      const firstPage = (await firstRes.json()) as GogPublicGamesPageResponse;
      allItems.push(...(firstPage._embedded?.items ?? []));
      const totalPages = Math.min(Number(firstPage.pages ?? 1) || 1, 5);
      for (let page = 2; page <= totalPages; page++) {
        const pageRes = await fetch(`${baseStatsUrl}&page=${page}`, { headers, next: { revalidate: 120 } });
        if (!pageRes.ok) break;
        const pageData = (await pageRes.json()) as GogPublicGamesPageResponse;
        allItems.push(...(pageData._embedded?.items ?? []));
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && allItems.length === 0) allItems.length = 0;
  }

  const sourceItems = allItems.length > 0 ? allItems : fallbackItems;
  const games: OwnedGame[] = [];
  const gameProgress: Record<number, readonly string[]> = {};
  let completedGamesCount = 0;
  let detailedFetches = 0;

  for (const item of sourceItems) {
    const appId = parseInt(item.game.id, 10);
    if (!appId || Number.isNaN(appId)) continue;
    const stat = extractUserStat(item.stats, userId);
    const pct = Number(stat?.achievementsPercentage ?? 0) || 0;
    let totalAchievements = 0;
    let unlockedCount = 0;

    if (item.game.achievementSupport && pct > 0 && detailedFetches < 5) {
      detailedFetches++;
      try {
        const gameUrl = `https://www.gog.com/u/${encodeURIComponent(username)}/game/${appId}`;
        const gameRes = await fetch(gameUrl, { headers, next: { revalidate: 120 } });
        if (gameRes.ok) {
          const parsedAch = parseGogGameAchievementsHtml(await gameRes.text(), userId);
          totalAchievements = parsedAch.totalAchievements;
          unlockedCount = parsedAch.unlockedCount;
          if (parsedAch.unlockedIds.length > 0) gameProgress[appId] = parsedAch.unlockedIds;
        }
      } catch (err: unknown) {
        if (err instanceof Error) totalAchievements = 0;
      }
    }
    if (pct >= 100 || (totalAchievements > 0 && unlockedCount >= totalAchievements)) {
      completedGamesCount++;
    }
    const playtimeMinutes = Number(stat?.playtime ?? 0) || 0;
    games.push({
      appId,
      name: item.game.title || `Jeu GOG #${appId}`,
      headerImg: normalizeGogImageUrl(item.game.image) || `https://images.gog-statics.com/products/${appId}/header.jpg`,
      platform: "gog",
      totalAchievements,
      unlockedCount,
      playtimeHours: playtimeMinutes > 0 ? Math.round((playtimeMinutes / 60) * 10) / 10 : undefined,
      lastPlayed: stat?.lastSession || undefined,
      addedAt: nowIso,
      source: "manual",
    });
  }

  return { games, gameProgress, completedGamesCount };
}
