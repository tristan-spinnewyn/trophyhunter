// lib/epic/achievements-query.ts
export const PLAYER_GAME_ACHIEVEMENT_QUERY = `query PlayerGameAchievementProgress($epicAccountId: String!) {
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
}`;
