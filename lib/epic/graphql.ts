// lib/epic/graphql.ts
const EPIC_GRAPHQL_ENDPOINT = "https://graphql.epicgames.com/graphql";
const EPIC_USER_AGENT = "EpicGamesLauncher/14.0.8-22004686+++Portal+Release-Live";

export async function fetchEpicPlayerAchievements(accountId: string, accessToken: string): Promise<any[]> {
  const gqlQuery = `query PlayerProfileAchievements($epicAccountId: String!) {
    PlayerAchievement {
      playerAchievementGameRecords(epicAccountId: $epicAccountId) {
        records {
          sandboxId
          totalUnlocked
          totalXP
          achievementSets {
            achievementSetId
            totalAchievements
            totalUnlocked
          }
          playerAchievements {
            playerAchievement {
              achievementName
              unlocked
              XP
            }
            achievementName
            unlocked
            XP
          }
        }
      }
    }
    PlayerProfile {
      playerProfile(epicAccountId: $epicAccountId) {
        achievementsSummaries {
          data {
            sandboxId
            totalUnlocked
            totalXP
            product {
              name
            }
          }
        }
      }
    }
  }`;

  try {
    const res = await fetch(EPIC_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": EPIC_USER_AGENT,
      },
      body: JSON.stringify({ query: gqlQuery, variables: { epicAccountId: accountId } }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const records: any[] = json?.data?.PlayerAchievement?.playerAchievementGameRecords?.records || [];
    const summaries: any[] =
      json?.data?.PlayerProfile?.playerProfile?.achievementsSummaries?.data ||
      json?.data?.PlayerProfile?.playerProfile?.achievementsSummaries ||
      [];

    const nameBySandbox = new Map<string, string>();
    for (const s of summaries) {
      const sId = (s.sandboxId || "").toLowerCase();
      const pName = s.product?.name || "";
      if (sId && pName) nameBySandbox.set(sId, pName);
    }

    for (const r of records) {
      const sId = (r.sandboxId || "").toLowerCase();
      if (sId && nameBySandbox.has(sId)) {
        r.productName = nameBySandbox.get(sId);
      }
    }
    return records;
  } catch {
    return [];
  }
}
