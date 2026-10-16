// lib/storage/constants.ts
import type { PlatformType } from "../types";

export const PREFIX = "trophyhunter_game_";
export const FAV_KEY = "trophyhunter_favorites";
export const RECENT_KEY = "trophyhunter_recent_games";
export const STEAM_USER_KEY = "trophyhunter_steam_user";
export const STEAM_API_KEY = "trophyhunter_steam_api_key";
export const ACCOUNT_KEY = "trophyhunter_user_account";
export const OWNED_GAMES_KEY = "trophyhunter_owned_games";
export const WISHLIST_KEY = "trophyhunter_wishlist";
export const COLLECTIONS_KEY = "trophyhunter_collections";

export function normalizeGameTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(
      /\b(game of the year edition|goty edition|definitive edition|director's cut|remastered|enhanced edition|special edition|standard edition|deluxe edition)\b/gi,
      ""
    )
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}

export const ALL_PLATFORMS: PlatformType[] = [
  "steam",
  "xbox",
  "epic",
  "gog",
];

export const PLATFORM_META: Record<
  PlatformType,
  {
    name: string;
    shortName: string;
    placeholder: string;
    badgeClass: string;
    accentColor: string;
    trophyLabel: string;
    completeLabel: string;
    supportsAutoSync: boolean;
  }
> = {
  steam: {
    name: "Steam",
    shortName: "Steam",
    placeholder: "SteamID64 (7656119...), pseudo ou URL du profil",
    badgeClass: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    accentColor: "from-sky-500 to-blue-600",
    trophyLabel: "Succès",
    completeLabel: "Jeux 100%",
    supportsAutoSync: true,
  },
  xbox: {
    name: "Xbox Live",
    shortName: "Xbox",
    placeholder: "Gamertag Xbox (ex: MasterChief#1234)",
    badgeClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    accentColor: "from-emerald-500 to-green-700",
    trophyLabel: "Succès",
    completeLabel: "Jeux 1000G",
    supportsAutoSync: true,
  },
  epic: {
    name: "Epic Games",
    shortName: "Epic",
    placeholder: "Pseudo Exophase ou compte Epic",
    badgeClass: "border-purple-500/40 bg-purple-500/10 text-purple-300",
    accentColor: "from-purple-500 to-fuchsia-700",
    trophyLabel: "Succès Epic",
    completeLabel: "Platines Epic",
    supportsAutoSync: true,
  },
  gog: {
    name: "GOG Galaxy",
    shortName: "GOG",
    placeholder: "Pseudo GOG.com",
    badgeClass: "border-violet-500/40 bg-violet-500/10 text-violet-300",
    accentColor: "from-violet-500 to-purple-800",
    trophyLabel: "Succès",
    completeLabel: "Jeux 100%",
    supportsAutoSync: true,
  },
};
