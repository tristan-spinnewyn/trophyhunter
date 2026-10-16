export interface AchSummary {
  sandboxId: string;
  totalUnlocked: number;
  totalAchievements: number;
  totalXP: number;
  gameTitle?: string;
  coverUrl?: string;
  playerAchievements?: any[];
}

export interface EpicTokenResponse {
  access_token: string;
  refresh_token?: string;
  account_id: string;
  displayName?: string;
}
