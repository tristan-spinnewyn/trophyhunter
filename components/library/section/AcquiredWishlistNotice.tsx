// components/library/section/AcquiredWishlistNotice.tsx

import type { GameStatus, OwnedGame, PlatformType } from "@/lib/types";
import { findAcquiredWishlistGames } from "@/lib/library/acquired-wishlist-games";

interface AcquiredWishlistNoticeProps {
  readonly games: readonly OwnedGame[];
  readonly wishlistIds: readonly number[];
  readonly onUpdateGameStatus: (appId: number, platform: PlatformType, status: GameStatus) => Promise<void> | void;
  readonly onToggleWishlist: (appId: number, platform: PlatformType) => Promise<void> | void;
}

const BUTTON_CLASS =
  "rounded-control border border-seam px-3 py-1.5 text-sm font-semibold text-paper transition hover:bg-edge";

/** Wished-for games now in the collection: offers to queue them, which fulfils the wish. */
export function AcquiredWishlistNotice({ games, wishlistIds, onUpdateGameStatus, onToggleWishlist }: AcquiredWishlistNoticeProps) {
  const acquired = findAcquiredWishlistGames(games, wishlistIds);
  if (acquired.length === 0) return null;

  return (
    <section aria-label="Jeux de ta liste d'envies acquis" className="rounded-control border border-edge bg-plank px-4 py-3">
      <p className="mb-2 flex items-center gap-2 text-sm text-dust">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-queued" />
        Achetés depuis ta liste d&apos;envies
      </p>
      <ul className="divide-y divide-edge">
        {acquired.map((game) => (
          <li key={`${game.platform}_${game.appId}`} className="flex flex-wrap items-center gap-2 py-2">
            <p className="mr-auto min-w-0 text-sm font-semibold text-paper">{game.name}</p>
            <button
              type="button"
              className={BUTTON_CLASS}
              aria-label={`Mettre ${game.name} au backlog`}
              onClick={() => {
                void onUpdateGameStatus(game.appId, game.platform, "backlog");
                void onToggleWishlist(game.appId, game.platform);
              }}
            >
              Mettre au backlog
            </button>
            <button
              type="button"
              className={`${BUTTON_CLASS} text-paper-dim`}
              aria-label={`Retirer ${game.name} de la liste d'envies`}
              onClick={() => void onToggleWishlist(game.appId, game.platform)}
            >
              Retirer de la liste
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
