// components/library/wishlist/WishlistPriceField.tsx
"use client";

import { useId, useState } from "react";
import type { WishlistEntry } from "@/lib/types";
import { formatPrice, hasReachedTarget } from "@/lib/wishlist/store-price";

interface WishlistPriceFieldProps {
  readonly entry: WishlistEntry;
  readonly onSaveTarget: (appId: number, targetPriceCents: number | null) => void;
}

const centsToInput = (cents: number | undefined) => (cents === undefined ? "" : String(cents / 100).replace(".", ","));

/** "9,5" or "9.50" euros as cents; null for an empty field, undefined when unreadable. */
function inputToCents(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const euros = Number(trimmed.replace(",", "."));
  return Number.isFinite(euros) && euros > 0 ? Math.round(euros * 100) : undefined;
}

/** A wished game's current store price, the price the owner waits for, and whether it was reached. */
export function WishlistPriceField({ entry, onSaveTarget }: WishlistPriceFieldProps) {
  const fieldId = useId();
  const saved = centsToInput(entry.targetPriceCents);
  const [draft, setDraft] = useState(saved);

  const save = () => {
    const cents = inputToCents(draft);
    if (cents === undefined) {
      setDraft(saved);
      return;
    }
    if (cents !== (entry.targetPriceCents ?? null)) onSaveTarget(entry.appId, cents);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="tabular-nums text-paper-dim">
        {entry.lastPriceCents !== undefined && entry.currency ? formatPrice(entry.lastPriceCents, entry.currency) : "Prix inconnu"}
      </span>
      <label htmlFor={fieldId} className="sr-only">
        Prix cible pour {entry.name} (€)
      </label>
      <input
        id={fieldId}
        type="text"
        inputMode="decimal"
        placeholder="Prix cible"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        className="w-20 rounded-control border border-edge bg-ink px-2 py-1 text-xs text-paper placeholder-faint focus:border-seam focus:outline-none"
      />
      {hasReachedTarget(entry) && (
        <span className="rounded-control border border-done/40 bg-done/10 px-1.5 py-0.5 font-semibold text-done">Prix atteint</span>
      )}
    </div>
  );
}
