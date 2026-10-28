// components/dashboard/nav/DashboardNavTabs.types.ts

import type { UserAccountProfile, PlatformType } from "@/lib/types";
import type { LibraryTab } from "@/lib/library/library-filters";

export type FeatureTabId = "gamepass" | "duplicates" | "wishlist" | "collections";

export interface PlatformTabItem {
  readonly id: PlatformType;
  readonly label: string;
  readonly count: number;
  readonly isConnected: boolean;
  readonly isActive: boolean;
  readonly activeClass: string;
}

export interface FeatureTabItem {
  readonly id: FeatureTabId;
  readonly label: string;
  readonly count?: number;
  readonly isActive: boolean;
  readonly activeClass: string;
  readonly iconColorClass: string;
  readonly activeBadgeClass: string;
}

export interface DashboardNavTabsProps {
  readonly activePlatformTab: LibraryTab;
  readonly onSelectTab: (tab: LibraryTab) => void;
  readonly ownedGamesCount: number;
  readonly platformCounts: Record<string, number>;
  readonly accountProfile: UserAccountProfile;
  readonly duplicateCount: number;
  readonly wishlistCount: number;
  readonly collectionsCount: number;
}
