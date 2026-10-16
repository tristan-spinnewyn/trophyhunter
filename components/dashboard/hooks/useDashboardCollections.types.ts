// components/dashboard/hooks/useDashboardCollections.types.ts

import type { User as UserType } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";

export interface UseDashboardCollectionsProps {
  currentUser?: UserType | null;
  initialWishlist?: number[];
  initialCollections?: LocalCollection[];
  onWishlistChange?: (wishlist: number[]) => void;
  onCollectionsChange?: (collections: LocalCollection[]) => void;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
}
