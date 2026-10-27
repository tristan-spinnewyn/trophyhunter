// components/dashboard/nav/navTabsConfig.services.ts

import type { PlatformType, UserAccountProfile } from "@/lib/types";
import { ALL_PLATFORMS, PLATFORM_META } from "@/lib/platforms";
import type {
  DashboardTabType,
  PlatformTabItem,
  FeatureTabItem,
} from "./DashboardNavTabs.types";

const PLATFORM_ACTIVE_STYLES: Record<PlatformType, string> = {
  steam: "border-sky-500/50 bg-sky-500/15 text-sky-200 shadow-sm shadow-sky-500/10",
  xbox: "border-emerald-500/50 bg-emerald-500/15 text-emerald-200 shadow-sm shadow-emerald-500/10",
  epic: "border-purple-500/50 bg-purple-500/15 text-purple-200 shadow-sm shadow-purple-500/10",
  gog: "border-violet-500/50 bg-violet-500/15 text-violet-200 shadow-sm shadow-violet-500/10",
};

export function buildPlatformTabItems(
  activePlatformTab: DashboardTabType,
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
      activeClass: PLATFORM_ACTIVE_STYLES[platform],
    };
  });
}

export interface FeatureTabCounts {
  readonly duplicateCount: number;
  readonly wishlistCount: number;
  readonly collectionsCount: number;
}

export function buildFeatureTabItems(
  activePlatformTab: DashboardTabType,
  counts: FeatureTabCounts
): FeatureTabItem[] {
  return [
    {
      id: "gamepass",
      label: "PC Game Pass",
      isActive: activePlatformTab === "gamepass",
      activeClass: "border-emerald-500/50 bg-emerald-500/15 text-emerald-200 shadow-sm shadow-emerald-500/10",
      iconColorClass: "text-emerald-400",
      activeBadgeClass: "bg-emerald-950/80 text-emerald-200",
    },
    {
      id: "duplicates",
      label: "Doublons",
      count: Math.max(0, counts.duplicateCount),
      isActive: activePlatformTab === "duplicates",
      activeClass: "border-purple-500/50 bg-purple-500/15 text-purple-200 shadow-sm shadow-purple-500/10",
      iconColorClass: "text-purple-400",
      activeBadgeClass: "bg-purple-950/80 text-purple-200",
    },
    {
      id: "wishlist",
      label: "Liste d'envies",
      count: Math.max(0, counts.wishlistCount),
      isActive: activePlatformTab === "wishlist",
      activeClass: "border-rose-500/50 bg-rose-500/15 text-rose-200 shadow-sm shadow-rose-500/10",
      iconColorClass: "text-rose-400",
      activeBadgeClass: "bg-rose-950/80 text-rose-200",
    },
    {
      id: "collections",
      label: "Collections",
      count: Math.max(0, counts.collectionsCount),
      isActive: activePlatformTab === "collections",
      activeClass: "border-indigo-500/50 bg-indigo-500/15 text-indigo-200 shadow-sm shadow-indigo-500/10",
      iconColorClass: "text-indigo-400",
      activeBadgeClass: "bg-indigo-950/80 text-indigo-200",
    },
  ];
}
