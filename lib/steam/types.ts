// lib/steam/types.ts
import type { RareAchievementShowcaseItem } from "@/lib/types";

export interface DiscoveredGameData {
  appId: number;
  name?: string;
  totalAchievements: number;
  unlockedCount: number;
  playtimeHours?: number;
  /** Real last session, when the platform reports it (ISO date). */
  lastPlayed?: string;
}

export interface SteamParsedProfile {
  steamId64: string;
  userIdentifier: string;
  personaName: string;
  avatarFull: string;
  onlineState: string;
  memberSince: string;
  location: string;
  hoursPlayed2Wk: number;
  level: number;
  gamesOwned: number;
  totalAchievements: number;
  completedGames: number;
  dlcCount: number;
  wishlistCount: number;
  badgesCount: number;
  rareShowcase: RareAchievementShowcaseItem[];
  baseUrl: string;
}
