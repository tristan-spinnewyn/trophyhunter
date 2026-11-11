// components/library/wishlist/WishlistNotOwnedPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { OwnedGame, PlatformType } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";

interface WishlistEntry {
  readonly appId: number;
  readonly platform: PlatformType;
  readonly name: string;
  readonly headerImg: string;
}

interface WishlistNotOwnedPanelProps {
  readonly ownedGames: readonly OwnedGame[];
  readonly wishlistIds: readonly number[];
  readonly onToggleWishlist: (appId: number, platform: PlatformType) => Promise<void> | void;
}

/** The wished-for games that are not in the collection yet, which the library shelves cannot show. */
export function WishlistNotOwnedPanel({ ownedGames, wishlistIds, onToggleWishlist }: WishlistNotOwnedPanelProps) {
  const [entries, setEntries] = useState<readonly WishlistEntry[]>([]);
  const wishlistKey = wishlistIds.join(",");

  useEffect(() => {
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
  }, [wishlistKey]);

  const owned = new Set(ownedGames.map((g) => g.appId));
  const wished = new Set(wishlistIds);
  const notOwned = entries.filter((e) => wished.has(e.appId) && !owned.has(e.appId));
  if (notOwned.length === 0) return null;

  return (
    <section aria-label="Pas encore dans ta collection" className="space-y-3">
      <h3 className="text-sm font-semibold text-dust">Pas encore dans ta collection</h3>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {notOwned.map((entry) => (
          <li key={entry.appId} className="flex items-center gap-3 rounded-control border border-edge bg-plank p-2">
            {entry.headerImg ? (
              <img src={entry.headerImg} alt="" className="h-10 w-20 shrink-0 rounded-object object-cover" />
            ) : (
              <span aria-hidden className="h-10 w-20 shrink-0 rounded-object bg-edge" />
            )}
            <p className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-paper">{entry.name}</span>
              <span className="text-xs text-dust">{PLATFORM_META[entry.platform]?.shortName}</span>
            </p>
            <button
              type="button"
              aria-label={`Retirer ${entry.name} de la liste d'envies`}
              title="Retirer de la liste d'envies"
              onClick={() => void onToggleWishlist(entry.appId, entry.platform)}
              className="rounded-control p-2 text-dust transition hover:bg-edge hover:text-paper"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
