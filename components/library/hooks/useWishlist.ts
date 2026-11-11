// components/library/hooks/useWishlist.ts
"use client";

import { useState, useEffect } from "react";
import type { PlatformType, User as UserType, WishlistGameDetails } from "@/lib/types";

interface UseWishlistProps {
  currentUser?: UserType | null;
  initialWishlist?: number[];
  onWishlistChange?: (wishlist: number[]) => void;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
}

/**
 * The default must be the same list on every render: the hook re-reads `initialWishlist` when it
 * changes, and a fresh `[]` each time made every toggle reset the wishlist and render forever.
 */
const NO_INITIAL_WISHLIST: number[] = [];

export function useWishlist({
  currentUser,
  initialWishlist = NO_INITIAL_WISHLIST,
  onWishlistChange,
  setBannerMsg,
}: UseWishlistProps) {
  const [wishlistIds, setWishlistIds] = useState<number[]>(initialWishlist);

  useEffect(() => {
    setWishlistIds(initialWishlist);
  }, [initialWishlist]);

  /** `details` names a game that is not in the collection, so the wishlist can show it. */
  const handleToggleWishlist = async (appId: number, platform: PlatformType, details?: WishlistGameDetails) => {
    const isCurrentlyWishlisted = wishlistIds.includes(appId);
    const nextAdded = !isCurrentlyWishlisted;
    const nextWishlist = nextAdded
      ? [...wishlistIds, appId]
      : wishlistIds.filter((id) => id !== appId);

    setWishlistIds(nextWishlist);
    if (onWishlistChange) onWishlistChange(nextWishlist);

    if (currentUser) {
      try {
        await fetch("/api/user/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId, platform, isWishlist: nextAdded, ...details }),
        });
      } catch {}
    }
    setBannerMsg({
      type: "success",
      text: nextAdded
        ? "Jeu ajouté à votre liste d'envies !"
        : "Jeu retiré de votre liste d'envies.",
    });
  };

  return {
    wishlistIds,
    setWishlistIds,
    handleToggleWishlist,
  };
}
