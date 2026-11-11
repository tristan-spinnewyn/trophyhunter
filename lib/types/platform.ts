// lib/types/platform.ts
/** Platforms whose account the app connects to and syncs. */
export type ConnectablePlatform = "steam" | "xbox" | "epic" | "gog";
/** Platforms with no account sync: their games and playtime are entered by hand. */
export type ManualPlatform = "switch" | "playstation" | "other";
export type PlatformType = ConnectablePlatform | ManualPlatform;

export interface PlatformStats {
  gamesOwned: number;
  totalAchievements: number;
  completedGames: number;
  hoursPlayed?: number;
  gamerScore?: number;
  trophies?: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  badges?: number;
  dlcCount?: number;
  wishlistCount?: number;
}

export interface RareAchievementShowcaseItem {
  appId: number;
  gameName: string;
  achievementName: string;
  percent: number;
  icon: string;
}

export interface PlatformAccount {
  platform: PlatformType;
  username: string;
  displayName: string;
  avatarUrl?: string;
  profileUrl?: string;
  level?: number;
  onlineState?: string;
  memberSince?: string;
  location?: string;
  connectedAt: string;
  lastSyncedAt?: string;
  stats: PlatformStats;
  rareShowcase?: RareAchievementShowcaseItem[];
  /** Whether an API key or token is saved for this account. The key itself never reaches the page. */
  hasApiKey?: boolean;
}

export interface UserAccountProfile {
  displayName: string;
  avatarUrl?: string;
  accounts: Partial<Record<PlatformType, PlatformAccount>>;
}
