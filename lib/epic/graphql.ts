// lib/epic/graphql.ts
import { EpicAuthError } from "./credentials";

export const EPIC_PRIMARY_GRAPHQL_ENDPOINT = "https://launcher.store.epicgames.com/graphql";

export const EPIC_GRAPHQL_ENDPOINTS: readonly string[] = [
  EPIC_PRIMARY_GRAPHQL_ENDPOINT,
  "https://graphql.epicgames.com/graphql",
];

export const EPIC_USER_AGENT = "EpicGamesLauncher/14.0.8-22004686+++Portal+Release-Live";

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

/**
 * Sends one GraphQL request to a single Epic endpoint, with the launcher headers.
 * Network errors propagate to the caller.
 */
export function postEpicGraphQL(
  endpoint: string,
  query: string,
  variables: Record<string, unknown>,
  accessToken: string
): Promise<Response> {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": EPIC_USER_AGENT,
    },
    body: JSON.stringify({ query, variables }),
  });
}

export async function epicGraphQL<T = Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown>,
  accessToken: string
): Promise<T | null> {
  for (const endpoint of EPIC_GRAPHQL_ENDPOINTS) {
    try {
      const res = await postEpicGraphQL(endpoint, query, variables, accessToken);
      if (res.status === 401 || res.status === 403) {
        throw new EpicAuthError();
      }
      if (!res.ok) continue;
      const json = (await res.json()) as { data?: T };
      if (json?.data) return json.data;
    } catch (err) {
      if (err instanceof EpicAuthError) throw err;
    }
  }
  return null;
}

export async function fetchEpicPlayerAchievements(
  accountId: string,
  accessToken: string
): Promise<EpicPlayerAchievementRecord[]> {
  try {
    const res = await postEpicGraphQL(
      EPIC_PRIMARY_GRAPHQL_ENDPOINT,
      PLAYER_PROFILE_ACH_QUERY,
      { epicAccountId: accountId },
      accessToken
    );
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
