// lib/platforms.ts
// Client-safe display metadata for the supported game platforms.
import type { PlatformType } from "./types";

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
