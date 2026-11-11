// lib/platforms.ts
// Client-safe display metadata for the supported game platforms.
import type { ConnectablePlatform, ManualPlatform, PlatformType, UserAccountProfile } from "./types";

export const CONNECTABLE_PLATFORMS: ConnectablePlatform[] = ["steam", "xbox", "epic", "gog"];
export const MANUAL_PLATFORMS: ManualPlatform[] = ["switch", "playstation", "other"];
export const ALL_PLATFORMS: PlatformType[] = [...CONNECTABLE_PLATFORMS, ...MANUAL_PLATFORMS];

export function isManualPlatform(platform: PlatformType): platform is ManualPlatform {
  return (MANUAL_PLATFORMS as readonly string[]).includes(platform);
}

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
  switch: {
    name: "Nintendo Switch",
    shortName: "Switch",
    placeholder: "",
    badgeClass: "border-dropped/40 bg-dropped/10 text-dropped",
    trophyLabel: "Succès",
    completeLabel: "Jeux 100%",
    supportsAutoSync: false,
  },
  playstation: {
    name: "PlayStation",
    shortName: "PlayStation",
    placeholder: "",
    badgeClass: "border-paused/40 bg-paused/10 text-paused",
    trophyLabel: "Trophées",
    completeLabel: "Platines",
    supportsAutoSync: false,
  },
  other: {
    name: "Autre / physique",
    shortName: "Autre",
    placeholder: "",
    badgeClass: "border-seam bg-edge text-paper-dim",
    trophyLabel: "Succès",
    completeLabel: "Jeux 100%",
    supportsAutoSync: false,
  },
};

export function countConnectedPlatforms(profile: UserAccountProfile): number {
  return CONNECTABLE_PLATFORMS.filter((p) => Boolean(profile.accounts[p])).length;
}
