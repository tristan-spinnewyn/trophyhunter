// lib/platforms.ts
// Client-safe display metadata for the supported game platforms.
import type { PlatformType, UserAccountProfile } from "./types";

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
    trophyLabel: string;
    completeLabel: string;
    supportsAutoSync: boolean;
  }
> = {
  steam: {
    name: "Steam",
    shortName: "Steam",
    placeholder: "SteamID64 (7656119...), pseudo ou URL du profil",
    badgeClass: "border-lamp/40 bg-lamp/10 text-lamp-bright",
    trophyLabel: "Succès",
    completeLabel: "Jeux 100%",
    supportsAutoSync: true,
  },
  xbox: {
    name: "Xbox Live",
    shortName: "Xbox",
    placeholder: "Gamertag Xbox (ex: MasterChief#1234)",
    badgeClass: "border-done/40 bg-done/10 text-done",
    trophyLabel: "Succès",
    completeLabel: "Jeux 1000G",
    supportsAutoSync: true,
  },
  epic: {
    name: "Epic Games",
    shortName: "Epic",
    placeholder: "Pseudo Exophase ou compte Epic",
    badgeClass: "border-platinum/40 bg-platinum/10 text-platinum",
    trophyLabel: "Succès Epic",
    completeLabel: "Platines Epic",
    supportsAutoSync: true,
  },
  gog: {
    name: "GOG Galaxy",
    shortName: "GOG",
    placeholder: "Pseudo GOG.com",
    badgeClass: "border-platinum/40 bg-platinum/10 text-platinum",
    trophyLabel: "Succès",
    completeLabel: "Jeux 100%",
    supportsAutoSync: true,
  },
};

export function countConnectedPlatforms(profile: UserAccountProfile): number {
  return ALL_PLATFORMS.filter((p) => Boolean(profile.accounts[p])).length;
}
