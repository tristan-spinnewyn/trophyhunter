import type { RareAchievementShowcaseItem } from "@/lib/types";

export const SEASONAL_BADGE_PATTERNS = [
  /soldes d/i,
  /collection d/i,
  /steam awards/i,
  /grand prix/i,
  /winter sale/i,
  /summer sale/i,
  /spring cleaning/i,
  /replay/i,
];

export const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&amp;": "&",
};

export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&(?:nbsp|quot|#39|lt|gt|amp);/g, (match) => HTML_ENTITIES[match] || match)
    .trim();
}

export interface DiscoveredGameData {
  appId: number;
  name?: string;
  totalAchievements: number;
  unlockedCount: number;
  playtimeHours?: number;
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
