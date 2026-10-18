// lib/epic/achievements-query.ts
export const PLAYER_GAME_ACHIEVEMENT_QUERY = `query PlayerGameAchievementProgress($epicAccountId: String!) {
  PlayerAchievement {
    playerAchievementGameRecords(epicAccountId: $epicAccountId, includeAchievements: true) {
      records {
        sandboxId
        totalUnlocked
        totalXP
        achievementSets {
          achievementSetId
          isBase
          totalUnlocked
          totalXP
        }
        playerAchievements {
          playerAchievement {
            achievementName
            unlocked
            XP
            unlockDate
          }
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
            product(locale: "fr") {
              name
              slug
            }
            baseOfferForSandbox(locale: "fr") {
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
  }
}`;

