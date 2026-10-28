// lib/library/library-filters.ts

import type { OwnedGame, PlatformType, CollectionWithGames } from "@/lib/types";
import { ALL_PLATFORMS } from "@/lib/platforms";

/** Which slice of the library is shown: one platform, everything, or a feature view. */
export type LibraryTab =
  | PlatformType
  | "all"
  | "duplicates"
  | "wishlist"
  | "collections"
  | "gamepass";

const FEATURE_TABS = ["all", "duplicates", "wishlist", "collections", "gamepass"] as const;

export function isFeatureTab(tab: LibraryTab): tab is Exclude<LibraryTab, PlatformType> {
  return (FEATURE_TABS as readonly string[]).includes(tab);
}

/** Reads a tab from untrusted input such as the `?tab=` query parameter. */
export function parseLibraryTab(value: string | null): LibraryTab {
  const known: readonly string[] = [...FEATURE_TABS, ...ALL_PLATFORMS];
  return value && known.includes(value) ? (value as LibraryTab) : "all";
}

export type AchievementFilterType = "all" | "with-achievements" | "no-achievements";

interface FilterParams {
  readonly games: OwnedGame[];
  readonly activePlatformTab: LibraryTab;
  readonly libPlatformFilter: PlatformType | "all";
  readonly libAchievementFilter: AchievementFilterType;
  readonly libSearch: string;
  readonly wishlistIds: number[];
  readonly collections: CollectionWithGames[];
  readonly selectedCollId: string | null;
}

export function filterGames(params: FilterParams): OwnedGame[] {
  const {
    games, activePlatformTab, libPlatformFilter,
    libAchievementFilter, libSearch, wishlistIds, collections, selectedCollId,
  } = params;

  const targetPlatform = isFeatureTab(activePlatformTab) ? libPlatformFilter : activePlatformTab;

  return games.filter((g) => {
    if (activePlatformTab === "wishlist") {
      if (!wishlistIds.includes(g.appId)) return false;
    } else if (activePlatformTab === "collections") {
      if (selectedCollId) {
        const coll = collections.find((c) => c.id === selectedCollId);
        if (!coll || !coll.gameIds.includes(g.appId)) return false;
      }
    } else if (targetPlatform !== "all" && activePlatformTab !== "duplicates") {
      if (g.platform !== targetPlatform) return false;
    }

    if (libAchievementFilter === "with-achievements" && g.totalAchievements === 0) return false;
    if (libAchievementFilter === "no-achievements" && g.totalAchievements > 0) return false;

    if (libSearch.trim()) {
      const q = libSearch.toLowerCase();
      if (!g.name.toLowerCase().includes(q) && !String(g.appId).includes(q)) return false;
    }
    return true;
  });
}
