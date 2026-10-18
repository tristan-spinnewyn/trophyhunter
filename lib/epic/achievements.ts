// lib/epic/achievements.ts
import type { AchSummary } from "./types";
import { PLAYER_GAME_ACHIEVEMENT_QUERY } from "./achievements-query";
import { parseEpicAchievementRecords, mergeEpicSummaries } from "./achievements-parser";
import { EPIC_PRIMARY_GRAPHQL_ENDPOINT, EPIC_USER_AGENT } from "./graphql-client";

export async function fetchEpicAchievementsGraphQL(
  accountId: string,
  accessToken: string
): Promise<{
  achBySandbox: Map<string, AchSummary>;
  rawTotalAchievements: number;
  rawCompletedGames: number;
}> {
  try {
    const gqlRes = await fetch(EPIC_PRIMARY_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": EPIC_USER_AGENT,
      },
      body: JSON.stringify({
        query: PLAYER_GAME_ACHIEVEMENT_QUERY,
        variables: { epicAccountId: accountId },
      }),
    });

    if (gqlRes.ok) {
      const gqlData = await gqlRes.json();
      const records = gqlData?.data?.PlayerAchievement?.playerAchievementGameRecords?.records || [];
      const parsed = parseEpicAchievementRecords(records);

      const summaries =
        gqlData?.data?.PlayerProfile?.playerProfile?.achievementsSummaries?.data ||
        gqlData?.data?.PlayerProfile?.playerProfile?.achievementsSummaries;
      const sumItems = Array.isArray(summaries) ? summaries : Array.isArray(summaries?.data) ? summaries.data : [];

      mergeEpicSummaries(parsed.achBySandbox, sumItems);
      return parsed;
    }
  } catch {}

  return { achBySandbox: new Map(), rawTotalAchievements: 0, rawCompletedGames: 0 };
}

