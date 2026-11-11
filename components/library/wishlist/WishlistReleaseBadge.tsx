// components/library/wishlist/WishlistReleaseBadge.tsx
import { describeRelease } from "@/lib/wishlist/release-label";

/** "Sort dans 12 j" under a wished game, or "Sorti !" once it is out; nothing for an unknown or older release. */
export function WishlistReleaseBadge({ releaseDate }: { readonly releaseDate?: string }) {
  const label = describeRelease(releaseDate, new Date());
  if (!label) return null;
  return <span className={`ml-2 text-xs ${label.isOut ? "font-semibold text-done" : "text-paper-dim"}`}>{label.text}</span>;
}
