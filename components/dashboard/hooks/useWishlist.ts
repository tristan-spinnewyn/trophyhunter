// components/dashboard/hooks/useWishlist.ts
"use client";

import { useState, useEffect } from "react";
import type { PlatformType, User as UserType } from "@/lib/types";

interface UseWishlistProps {
  currentUser?: UserType | null;
  initialWishlist?: number[];
  onWishlistChange?: (wishlist: number[]) => void;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
}

export function useWishlist({
  currentUser,
  initialWishlist = [],
  onWishlistChange,
  setBannerMsg,
}: UseWishlistProps) {
  const [wishlistIds, setWishlistIds] = useState<number[]>(initialWishlist);

  useEffect(() => {
    setWishlistIds(initialWishlist);
  }, [initialWishlist]);

  const handleToggleWishlist = async (appId: number, platform: PlatformType) => {
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
          body: JSON.stringify({ appId, platform, isWishlist: nextAdded }),
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
