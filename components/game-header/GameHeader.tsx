// components/game-header/GameHeader.tsx
"use client";

import type { CSSProperties } from "react";
import { GameHeaderActions, GameHeaderBackButton } from "./GameHeaderActions";
import { GameHeaderGuides } from "./GameHeaderGuides";
import { GameHuntingMetaBar } from "../hunting/GameHuntingMetaBar";
import { GameStatusPicker } from "../game-status/GameStatusPicker";
import { CompletionDateField } from "../game-status/CompletionDateField";
import { GameReviewField } from "../game-status/GameReviewField";
import { canBeReviewed, type GameReview } from "@/lib/game-review/game-review";
import { getSpineStyle } from "@/lib/library/spine-style";
import { getPortraitCoverUrl } from "@/lib/library/cover-image";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import { fallBackThenHide } from "@/components/ui/coverFallback";
import type { GameDetails, GameStatus, PlatformType } from "@/lib/types";
import type { GameHuntingMeta, GameHuntingOverride } from "@/lib/hunting/hunting.types";

export interface GameHeaderProps {
  readonly game: GameDetails;
  /** Store the page shows the game for; picks the same spine colour as on the shelf. */
  readonly platform?: PlatformType;
  readonly isFavorite: boolean;
  readonly onToggleFavorite: () => void;
  readonly isOwned?: boolean;
  readonly onToggleOwned?: () => void;
  readonly gameStatus?: GameStatus;
  readonly onChangeGameStatus?: (status: GameStatus) => void;
  /** When a finished game was finished (ISO date); editable through `onChangeCompletedAt`. */
  readonly completedAt?: string;
  readonly onChangeCompletedAt?: (day: string) => void;
  /** The owner's rating and review, offered once the game is finished or abandoned. */
  readonly rating?: number;
  readonly review?: string;
  readonly onSaveReview?: (review: GameReview) => void;
  readonly huntingMeta?: GameHuntingMeta;
  readonly onSaveHuntingOverride?: (override: GameHuntingOverride | undefined) => void;
  readonly onBackToLibrary?: () => void;
  /** Hours played, when the game is in the collection. */
  readonly playtimeHours?: number;
}

export default function GameHeader({
  game,
  platform = "steam",
  isFavorite,
  onToggleFavorite,
  isOwned = false,
  onToggleOwned,
  gameStatus,
  onChangeGameStatus,
  completedAt,
  onChangeCompletedAt,
  rating,
  review,
  onSaveReview,
  huntingMeta,
  onSaveHuntingOverride,
  onBackToLibrary,
  playtimeHours,
}: GameHeaderProps) {
  const isFinished = isOwned && resolveGameStatus(gameStatus) === "completed";
  const isReviewable = isOwned && canBeReviewed(gameStatus);
  // The game's spine colour carries over from the shelf to the top of its page.
  const spine = getSpineStyle({ appId: game.id, name: game.name, platform });
  const bandStyle = {
    background: `linear-gradient(to bottom, color-mix(in srgb, ${spine.background} 60%, var(--ink)) 0, color-mix(in srgb, ${spine.background} 60%, var(--ink)) 40%, var(--ink) 100%)`,
  } as CSSProperties;

  return (
    <header className="relative">
      <div aria-hidden className="pointer-events-none absolute left-1/2 -top-8 h-[440px] w-screen -translate-x-1/2" style={bandStyle} />

      <div className="relative">
      {onBackToLibrary && <GameHeaderBackButton onBackToLibrary={onBackToLibrary} />}

      <div className="mt-5 grid grid-cols-[110px_1fr] items-end gap-x-5 gap-y-4 sm:grid-cols-[220px_1fr] sm:gap-x-9">
        <div className="aspect-[2/3] overflow-hidden rounded-object bg-plank shadow-[0_18px_30px_-12px_rgb(0_0_0/.7)] sm:row-span-3">
          <img
            src={getPortraitCoverUrl({ appId: game.id, platform, headerImg: game.headerImg })}
            alt={`Jaquette de ${game.name}`}
            className="h-full w-full object-cover"
            onError={fallBackThenHide(game.headerImg)}
          />
        </div>

        <h1 className="font-wide text-[30px] font-extrabold leading-[0.98] tracking-[-0.025em] text-paper line-clamp-3 sm:text-5xl lg:text-6xl">
          {game.name}
        </h1>

        <p className="col-span-2 flex flex-wrap gap-x-4 text-paper/80 sm:col-span-1">
          {game.developers && game.developers.length > 0 && <span className="truncate">{game.developers.join(", ")}</span>}
          {playtimeHours !== undefined && playtimeHours > 0 && (
            <span className="font-semibold text-paper">{playtimeHours} h jouées</span>
          )}
          <span>{game.totalAchievements} succès</span>
        </p>

        <div className="col-span-2 space-y-3 sm:col-span-1">
          {onChangeGameStatus && (
            <GameStatusPicker status={isOwned ? resolveGameStatus(gameStatus) : null} onChange={onChangeGameStatus} />
          )}
          {isFinished && onChangeCompletedAt && (
            <CompletionDateField completedAt={completedAt} onChange={onChangeCompletedAt} />
          )}
          {isReviewable && onSaveReview && <GameReviewField rating={rating} review={review} onSave={onSaveReview} />}
          <GameHeaderActions
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            isOwned={isOwned}
            onToggleOwned={onToggleOwned}
          />
        </div>
      </div>

      {huntingMeta && <GameHuntingMetaBar meta={huntingMeta} onSaveOverride={onSaveHuntingOverride} />}

      <GameHeaderGuides game={game} />
      </div>
    </header>
  );
}

