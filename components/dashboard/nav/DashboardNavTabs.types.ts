// components/dashboard/nav/DashboardNavTabs.types.ts

import type {
  UserAccountProfile,
  PlatformType,
  User as UserType,
} from "@/lib/types";

export type DashboardTabType =
  | PlatformType
  | "all"
  | "duplicates"
  | "wishlist"
  | "collections";

export interface DashboardNavTabsProps {
  activePlatformTab: DashboardTabType;
  onSelectTab: (tab: DashboardTabType) => void;
  ownedGamesCount: number;
  platformCounts: Record<string, number>;
  accountProfile: UserAccountProfile;
  duplicateCount: number;
  wishlistCount: number;
  collectionsCount: number;
  currentUser?: UserType | null;
  onOpenAuthModal?: () => void;
}
