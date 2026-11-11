// components/library/nav/navTabsConfig.services.ts

import type { UserAccountProfile } from "@/lib/types";
import { ALL_PLATFORMS, PLATFORM_META, isManualPlatform } from "@/lib/platforms";
import type { LibraryTab } from "@/lib/library/library-filters";
import type { PlatformTabItem, FeatureTabItem } from "./LibraryNavTabs.types";

export function buildPlatformTabItems(
  activePlatformTab: LibraryTab,
  platformCounts: Record<string, number>,
  accountProfile: UserAccountProfile
): PlatformTabItem[] {
  const countOf = (platform: string) => {
    const rawCount = platformCounts[platform];
    return typeof rawCount === "number" && rawCount > 0 ? rawCount : 0;
  };
  // Platforms tracked by hand only get a tab once they hold games.
  const shown = ALL_PLATFORMS.filter((platform) => !isManualPlatform(platform) || countOf(platform) > 0);

  return shown.map((platform) => {
    const meta = PLATFORM_META[platform];
    const count = countOf(platform);
    const isConnected = Boolean(accountProfile?.accounts?.[platform]);

    return {
      id: platform,
      label: meta.shortName,
      count,
      isConnected,
      isActive: activePlatformTab === platform,
    };
  });
}

export interface FeatureTabCounts {
  readonly duplicateCount: number;
  readonly wishlistCount: number;
  readonly collectionsCount: number;
}

export function buildFeatureTabItems(
  activePlatformTab: LibraryTab,
  counts: FeatureTabCounts
): FeatureTabItem[] {
  return [
    {
      id: "gamepass",
      label: "PC Game Pass",
      isActive: activePlatformTab === "gamepass",
    },
    {
      id: "duplicates",
      label: "Doublons",
      count: Math.max(0, counts.duplicateCount),
      isActive: activePlatformTab === "duplicates",
    },
    {
      id: "wishlist",
      label: "Liste d'envies",
      count: Math.max(0, counts.wishlistCount),
      isActive: activePlatformTab === "wishlist",
    },
    {
      id: "collections",
      label: "Collections",
      count: Math.max(0, counts.collectionsCount),
      isActive: activePlatformTab === "collections",
    },
  ];
}
