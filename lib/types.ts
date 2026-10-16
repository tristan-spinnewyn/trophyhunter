export interface GameSearchResult {
  id: number;
  name: string;
  img: string;
  price?: string;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  percent: number;
  hidden: boolean;
  missable: boolean;
  notes?: string;
}

export interface GameDetails {
  id: number;
  name: string;
  headerImg: string;
  shortDesc?: string;
  developers?: string[];
  publishers?: string[];
  totalAchievements: number;
  achievements: Achievement[];
  guideLinks: {
    steamGuidesUrl: string;
    psthcUrl: string;
    youtubeUrl: string;
  };
}

export type FilterStatus = 'all' | 'locked' | 'unlocked' | 'missable' | 'hidden';

export type SortOrder = 'default' | 'rarity-asc' | 'rarity-desc' | 'name-asc';

export interface UserGameProgress {
  unlockedIds: string[];
  notes: Record<string, string>;
  lastPlayed?: string;
}

export type PlatformType = "steam" | "xbox" | "epic" | "gog";

export interface PlatformStats {
  gamesOwned: number;
  totalAchievements: number;
  completedGames: number; // Platines / 100%
  hoursPlayed?: number;
  gamerScore?: number; // Xbox Gamerscore or RA Points
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
}

export interface OwnedGame {
  appId: number;
  name: string;
  headerImg: string;
  platform: PlatformType;
  totalAchievements: number;
  unlockedCount: number;
  playtimeHours?: number;
  lastPlayed?: string;
  addedAt: string;
  source?: 'steam-auto' | 'steam-import' | 'manual';
}

export interface UserAccountProfile {
  displayName: string;
  avatarUrl?: string;
  accounts: Partial<Record<PlatformType, PlatformAccount>>;
}
