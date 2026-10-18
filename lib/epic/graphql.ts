// lib/epic/graphql.ts
import { EPIC_PRIMARY_GRAPHQL_ENDPOINT, EPIC_USER_AGENT } from "./graphql-client";

export interface EpicPlayerAchievementRecord {
  sandboxId?: string;
  totalUnlocked?: number;
  totalXP?: number;
  productName?: string;
  totalProductAchievements?: number;
  achievementSets?: ReadonlyArray<{
    readonly achievementSetId?: string;
    readonly totalAchievements?: number;
    readonly totalUnlocked?: number;
  }>;
  playerAchievements?: readonly unknown[];
}

const PLAYER_PROFILE_ACH_QUERY = `query PlayerProfileAchievements($epicAccountId: String!) {
  PlayerAchievement {
    playerAchievementGameRecords(epicAccountId: $epicAccountId, includeAchievements: true) {
      records {
        sandboxId
        totalUnlocked
        totalXP
        achievementSets { achievementSetId isBase totalUnlocked totalXP }
        playerAchievements {
          playerAchievement { achievementName unlocked XP unlockDate }
        }
      }
    }
  }
  PlayerProfile {
    playerProfile(epicAccountId: $epicAccountId) {
      achievementsSummaries {
        ... on PlayerAchievementResponseSuccess {
          data {
            sandboxId
            totalUnlocked
            totalXP
            product(locale: "fr") { name }
            productAchievements { totalAchievements }
          }
        }
      }
    }
  }
}`;

export async function fetchEpicPlayerAchievements(
  accountId: string,
  accessToken: string
): Promise<EpicPlayerAchievementRecord[]> {
  try {
    const res = await fetch(EPIC_PRIMARY_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": EPIC_USER_AGENT,
      },
      body: JSON.stringify({ query: PLAYER_PROFILE_ACH_QUERY, variables: { epicAccountId: accountId } }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const records: EpicPlayerAchievementRecord[] =
      json?.data?.PlayerAchievement?.playerAchievementGameRecords?.records || [];
    const rawSummaries =
      json?.data?.PlayerProfile?.playerProfile?.achievementsSummaries?.data ||
      json?.data?.PlayerProfile?.playerProfile?.achievementsSummaries ||
      [];
    const summaries = Array.isArray(rawSummaries) ? rawSummaries : [];

    const metaBySandbox = new Map<string, { name: string; total: number }>();
    for (const s of summaries) {
      const sId = String(s?.sandboxId || "").toLowerCase();
      if (sId) {
        metaBySandbox.set(sId, {
          name: String(s?.product?.name || ""),
          total: Number(s?.productAchievements?.totalAchievements) || 0,
        });
      }
    }

    for (const r of records) {
      const sId = String(r.sandboxId || "").toLowerCase();
      const meta = sId ? metaBySandbox.get(sId) : undefined;
      if (meta) {
        if (meta.name) r.productName = meta.name;
        if (meta.total > 0) r.totalProductAchievements = meta.total;
      }
    }
    return records;
  } catch {
    return [];
  }
}


