// components/library/wishlist/PriceReachedNotice.tsx
"use client";

import type { OwnedGame } from "@/lib/types";
import { formatPrice, hasReachedTarget } from "@/lib/wishlist/store-price";
import { useWishlistEntries } from "./useWishlistEntries";

interface PriceReachedNoticeProps {
  readonly ownedGames: readonly OwnedGame[];
  readonly isSignedIn: boolean;
}

/** Wished games, not owned yet, whose store price fell to the price the owner waits for. */
export function PriceReachedNotice({ ownedGames, isSignedIn }: PriceReachedNoticeProps) {
  const { entries } = useWishlistEntries("", isSignedIn);
  if (!isSignedIn) return null;

  const owned = new Set(ownedGames.map((g) => g.appId));
  const reached = entries.filter((e) => !owned.has(e.appId) && hasReachedTarget(e));
  if (reached.length === 0) return null;

  return (
    <section aria-label="Prix atteints" className="rounded-control border border-edge bg-plank px-4 py-3">
      <p className="mb-2 flex items-center gap-2 text-sm text-dust">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-done" />
        Ta liste d&apos;envies a des prix atteints
      </p>
      <ul className="divide-y divide-edge">
        {reached.map((entry) => (
          <li key={entry.appId} className="py-2 text-sm text-paper-dim">
            <strong className="font-semibold text-paper">{entry.name}</strong> à{" "}
            {formatPrice(entry.lastPriceCents as number, entry.currency ?? "EUR")}
          </li>
        ))}
      </ul>
    </section>
  );
}
