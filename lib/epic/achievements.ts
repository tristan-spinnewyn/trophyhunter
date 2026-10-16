import type { AchSummary } from "./types";
import { extractBestCover } from "./helpers";
import { unwrapPlayerAchievement } from "./game-achievements";

export async function fetchEpicAchievementsGraphQL(
  accountId: string,
  accessToken: string
): Promise<{
  achBySandbox: Map<string, AchSummary>;
  rawTotalAchievements: number;
  rawCompletedGames: number;
}> {
  const achBySandbox = new Map<string, AchSummary>();
  let rawTotalAchievements = 0;
  let rawCompletedGames = 0;

  try {
    const gqlRes = await fetch("https://graphql.epicgames.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent":
          "EpicGamesLauncher/14.0.8-22004686+++Portal+Release-Live",
      },
      body: JSON.stringify({
        query: `query PlayerGameAchievementProgress($epicAccountId: String!) {
          PlayerAchievement {
            playerAchievementGameRecords(epicAccountId: $epicAccountId) {
              records {
                sandboxId
                totalUnlocked
                totalXP
                achievementSets {
                  achievementSetId
                  isBase
                  totalUnlocked
                  totalXP
                  totalAchievements
                }
                playerAchievements {
                  playerAchievement {
                    achievementName
                    unlocked
                    XP
                  }
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
                  baseOfferForSandbox {
                    keyImages {
                      type
                      url
                    }
                  }
                  productAchievements {
                    totalAchievements
                    totalProductXP
                  }
                }
              }
            }
          }
        }`,
        variables: { epicAccountId: accountId },
      }),
    });

    if (gqlRes.ok) {
      const gqlData = await gqlRes.json();
      const records =
        gqlData?.data?.PlayerAchievement?.playerAchievementGameRecords
          ?.records || [];

      for (const achRec of records) {
        const sId = (achRec.sandboxId || "").toLowerCase();
        if (!sId) continue;

        const unlocked = achRec.totalUnlocked || 0;
        rawTotalAchievements += unlocked;

        const playerAchs = Array.isArray(achRec.playerAchievements)
          ? achRec.playerAchievements.map(unwrapPlayerAchievement)
          : [];
        const sets = Array.isArray(achRec.achievementSets)
          ? achRec.achievementSets
          : [];

        let totalInGame = playerAchs.length;
        if (totalInGame === 0) {
          totalInGame = Math.max(
            unlocked,
            sets.reduce(
              (acc: number, s: any) =>
                acc + (s.totalAchievements || s.totalUnlocked || 0),
              0
            )
          );
        }

        if (unlocked > 0 && totalInGame > 0 && unlocked >= totalInGame) {
          rawCompletedGames += 1;
        }

        achBySandbox.set(sId, {
          sandboxId: sId,
          totalUnlocked: unlocked,
          totalAchievements: totalInGame,
          totalXP: achRec.totalXP || 0,
          playerAchievements: playerAchs,
        });
      }

      // Also parse PlayerProfile summaries if returned
      const summaries =
        gqlData?.data?.PlayerProfile?.playerProfile?.achievementsSummaries
          ?.data ||
        gqlData?.data?.PlayerProfile?.playerProfile?.achievementsSummaries;
      const sumItems = Array.isArray(summaries)
        ? summaries
        : Array.isArray(summaries?.data)
        ? summaries.data
        : [];

      for (const it of sumItems) {
        const sId = (it.sandboxId || "").toLowerCase();
        if (!sId) continue;
        const unlocked = it.totalUnlocked || 0;
        const total =
          it.productAchievements?.totalAchievements ||
          Math.max(unlocked, it.totalAchievements || 0);
        const title = it.product?.name || "";
        const cover = extractBestCover(it.baseOfferForSandbox?.keyImages);

        const existing = achBySandbox.get(sId);
        if (existing) {
          if (title && !existing.gameTitle) existing.gameTitle = title;
          if (cover && !existing.coverUrl) existing.coverUrl = cover;
          if (total > existing.totalAchievements)
            existing.totalAchievements = total;
          if (unlocked > existing.totalUnlocked)
            existing.totalUnlocked = unlocked;
        } else {
          achBySandbox.set(sId, {
            sandboxId: sId,
            totalUnlocked: unlocked,
            totalAchievements: total,
            totalXP: it.totalXP || 0,
            gameTitle: title,
            coverUrl: cover,
          });
        }
      }
    }
  } catch {}

  return { achBySandbox, rawTotalAchievements, rawCompletedGames };
}
