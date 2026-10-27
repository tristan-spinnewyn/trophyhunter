// components/dashboard/hooks/useDashboardCollections.types.ts

import type { User as UserType, CollectionWithGames } from "@/lib/types";

export interface UseDashboardCollectionsProps {
  currentUser?: UserType | null;
  initialWishlist?: number[];
  initialCollections?: CollectionWithGames[];
  onWishlistChange?: (wishlist: number[]) => void;
  onCollectionsChange?: (collections: CollectionWithGames[]) => void;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
}
