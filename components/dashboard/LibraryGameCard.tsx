// components/dashboard/LibraryGameCard.tsx
"use client";

import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import type { LibraryGameCardProps } from "./library/LibraryGameCard.types";
import { LibraryGameCardCover } from "./library/LibraryGameCardCover";
import { LibraryGameCardProgress } from "./library/LibraryGameCardProgress";
import { LibraryGameStatusSelector } from "./library/LibraryGameStatusSelector";
import { LibraryGameCardActions } from "./library/LibraryGameCardActions";

export type { LibraryGameCardProps };

export default function LibraryGameCard({
  game: g,
  steamAccount,
  activePlatformTab,
  selectedCollId,
  wishlistIds,
  collections,
  onSelectGame,
  onToggleWishlist,
  onOpenAddToCollection,
  onRemoveFromCollection,
  onSyncGame,
  onRemoveGame,
  onUpdateGameStatus,
}: LibraryGameCardProps) {
  const isPlatinum =
    g.totalAchievements > 0 && g.unlockedCount >= g.totalAchievements;
  const gameStatus = resolveGameStatus(g.status);
  const pct =
    g.totalAchievements > 0
      ? Math.min(100, Math.round((g.unlockedCount / g.totalAchievements) * 100))
      : 0;

  const canSync =
    (g.platform === "steam" && !!steamAccount?.username) ||
    g.platform === "epic";

  const borderStyle = isPlatinum
    ? "border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 hover:border-amber-500/70 hover:shadow-amber-500/10"
    : gameStatus === "completed"
    ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950/15 via-slate-900 to-slate-950 hover:border-emerald-500/70 hover:shadow-emerald-500/10"
    : gameStatus === "in-progress"
    ? "border-sky-500/40 bg-gradient-to-br from-sky-950/15 via-slate-900 to-slate-950 hover:border-sky-500/70 hover:shadow-sky-500/10"
    : "border-slate-800/90 bg-slate-900/90 hover:border-sky-500/50 hover:shadow-sky-500/10";

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${borderStyle}`}
    >
      <LibraryGameCardCover
        game={g}
        isPlatinum={isPlatinum}
        onSelectGame={onSelectGame}
      />

      <div className="flex-1 flex flex-col justify-between p-3 space-y-2.5">
        <LibraryGameCardProgress
          game={g}
          isPlatinum={isPlatinum}
          pct={pct}
          onSelectGame={onSelectGame}
        />

        <LibraryGameStatusSelector
          game={g}
          onUpdateGameStatus={onUpdateGameStatus}
        />

        <LibraryGameCardActions
          game={g}
          activePlatformTab={activePlatformTab}
          selectedCollId={selectedCollId}
          wishlistIds={wishlistIds}
          collections={collections}
          canSync={canSync}
          onSelectGame={onSelectGame}
          onToggleWishlist={onToggleWishlist}
          onOpenAddToCollection={onOpenAddToCollection}
          onRemoveFromCollection={onRemoveFromCollection}
          onSyncGame={onSyncGame}
          onRemoveGame={onRemoveGame}
        />
      </div>
    </div>
  );
}
