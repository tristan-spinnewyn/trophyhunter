// components/library/wishlist/useWishlistEntries.ts
"use client";

import { useEffect, useState } from "react";
import type { WishlistEntry } from "@/lib/types";

/**
 * The wishlist with its prices, reloaded when `reloadKey` changes; `enabled: false` asks nothing.
 * Target prices are shown at once and put back if the save fails.
 */
export function useWishlistEntries(reloadKey: string, enabled = true) {
  const [entries, setEntries] = useState<readonly WishlistEntry[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let isCurrent = true;
    fetch("/api/user/wishlist")
      .then((res) => (res.ok ? res.json() : { wishlist: [] }))
      .then((data: { wishlist?: WishlistEntry[] }) => {
        if (isCurrent) setEntries(data.wishlist ?? []);
      })
      .catch(() => {
        if (isCurrent) setEntries([]);
      });
    return () => {
      isCurrent = false;
    };
  }, [reloadKey, enabled]);

  const setTarget = (appId: number, targetPriceCents: number | undefined) =>
    setEntries((prev) => prev.map((e) => (e.appId === appId ? { ...e, targetPriceCents } : e)));

  const saveTargetPrice = async (appId: number, targetPriceCents: number | null) => {
    const previous = entries.find((e) => e.appId === appId)?.targetPriceCents;
    setTarget(appId, targetPriceCents ?? undefined);
    try {
      const res = await fetch("/api/user/wishlist/target", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, targetPriceCents }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.error("Failed to save the target price:", error);
      setTarget(appId, previous);
    }
  };

  return { entries, saveTargetPrice };
}
