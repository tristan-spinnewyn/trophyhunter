// components/library/LibraryGameCard.tsx
"use client";
import { LibraryGameCardCover } from "./card/LibraryGameCardCover";
import { LibraryGameCardProgress } from "./card/LibraryGameCardProgress";
import { LibraryGameStatusSelector } from "./card/LibraryGameStatusSelector";
import { LibraryGameCardActions } from "./card/LibraryGameCardActions";
import type {
  GameStatus,
  OwnedGame,
  PlatformAccount,
  PlatformType,
} from "@/lib/types";
import type { CollectionWithGames } from "@/lib/types";

export interface LibraryGameCardProps {
  readonly game: OwnedGame;
  readonly steamAccount?: PlatformAccount;
  readonly activePlatformTab: string;
  readonly selectedCollId: string | null;
  readonly wishlistIds: number[];
  readonly collections: CollectionWithGames[];
  readonly onSelectGame: (appId: number) => void;
  readonly onToggleWishlist: (appId: number, platform: PlatformType) => void;
  readonly onOpenAddToCollection: (game: OwnedGame) => void;
  readonly onRemoveFromCollection: (
    collectionId: string,
    appId: number,
    platform: PlatformType
  ) => void;
  readonly onSyncGame: (game: OwnedGame) => Promise<void>;
  readonly onRemoveGame: (appId: number, platform: PlatformType) => Promise<void>;
  readonly onUpdateGameStatus?: (
    appId: number,
    platform: PlatformType,
    status: GameStatus
  ) => Promise<void> | void;
}


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
  const pct =
    g.totalAchievements > 0
      ? Math.min(100, Math.round((g.unlockedCount / g.totalAchievements) * 100))
      : 0;

  const canSync =
    (g.platform === "steam" && !!steamAccount?.username) ||
    g.platform === "epic";

  return (
    <article className="group relative flex flex-col">
      <LibraryGameCardCover
        game={g}
        isPlatinum={isPlatinum}
        onSelectGame={onSelectGame}
      />

      <div className="flex flex-1 flex-col justify-between gap-3 pt-3.5">
        <LibraryGameCardProgress
          game={g}
          isPlatinum={isPlatinum}
          pct={pct}
          onSelectGame={onSelectGame}
        />

        <LibraryGameCardActions
          game={g}
          activePlatformTab={activePlatformTab}
          selectedCollId={selectedCollId}
          wishlistIds={wishlistIds}
          collections={collections}
          canSync={canSync}
          statusSelector={
            <LibraryGameStatusSelector game={g} onUpdateGameStatus={onUpdateGameStatus} />
          }
          onToggleWishlist={onToggleWishlist}
          onOpenAddToCollection={onOpenAddToCollection}
          onRemoveFromCollection={onRemoveFromCollection}
          onSyncGame={onSyncGame}
          onRemoveGame={onRemoveGame}
        />
      </div>
    </article>
  );
}
