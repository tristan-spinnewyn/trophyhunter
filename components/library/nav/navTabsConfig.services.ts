// components/library/nav/navTabsConfig.services.ts

import type { UserAccountProfile } from "@/lib/types";
import { ALL_PLATFORMS, PLATFORM_META } from "@/lib/platforms";
import type { LibraryTab } from "@/lib/library/library-filters";
import type { PlatformTabItem, FeatureTabItem } from "./LibraryNavTabs.types";

const ACTIVE_TAB_CLASS = "border-slate-700 bg-slate-800 text-white";

export function buildPlatformTabItems(
  activePlatformTab: LibraryTab,
  platformCounts: Record<string, number>,
  accountProfile: UserAccountProfile
): PlatformTabItem[] {
  return ALL_PLATFORMS.map((platform) => {
    const meta = PLATFORM_META[platform];
    const rawCount = platformCounts[platform];
    const count = typeof rawCount === "number" && rawCount > 0 ? rawCount : 0;
    const isConnected = Boolean(accountProfile?.accounts?.[platform]);

    return {
      id: platform,
      label: meta.shortName,
      count,
      isConnected,
      isActive: activePlatformTab === platform,
      activeClass: ACTIVE_TAB_CLASS,
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
      activeClass: ACTIVE_TAB_CLASS,
      iconColorClass: "text-emerald-400",
    },
    {
      id: "duplicates",
      label: "Doublons",
      count: Math.max(0, counts.duplicateCount),
      isActive: activePlatformTab === "duplicates",
      activeClass: ACTIVE_TAB_CLASS,
      iconColorClass: "text-purple-400",
    },
    {
      id: "wishlist",
      label: "Liste d'envies",
      count: Math.max(0, counts.wishlistCount),
      isActive: activePlatformTab === "wishlist",
      activeClass: ACTIVE_TAB_CLASS,
      iconColorClass: "text-rose-400",
    },
    {
      id: "collections",
      label: "Collections",
      count: Math.max(0, counts.collectionsCount),
      isActive: activePlatformTab === "collections",
      activeClass: ACTIVE_TAB_CLASS,
      iconColorClass: "text-indigo-400",
    },
  ];
}
