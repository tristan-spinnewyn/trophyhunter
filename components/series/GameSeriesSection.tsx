// components/series/GameSeriesSection.tsx
"use client";

import type { SeriesMember, SeriesMemberView, SeriesView } from "@/lib/series/series.types";
import { describeSeriesProgress } from "@/lib/series/series-matching";
import { GAME_STATUS_META } from "@/lib/game-status/game-status.services";

interface GameSeriesSectionProps {
  readonly series: SeriesView;
  readonly wishlistIds: readonly number[];
  readonly onWish: (member: SeriesMember) => void;
  readonly onOpenGame: (appId: number) => void;
}

function MemberState({ member, wishlistIds, onWish }: { member: SeriesMemberView } & Pick<GameSeriesSectionProps, "wishlistIds" | "onWish">) {
  if (member.owned) {
    const meta = GAME_STATUS_META[member.owned.status];
    return (
      <span className="flex items-center gap-1.5 text-sm text-paper-dim">
        <span aria-hidden className={`h-2 w-2 rounded-object ${meta.dotClass}`} />
        {meta.label}
      </span>
    );
  }
  if (member.steamAppId === undefined) return <span className="text-sm text-faint">Pas dans ta collection</span>;
  if (wishlistIds.includes(member.steamAppId)) return <span className="text-sm text-dust">Dans ta liste d&apos;envies</span>;
  return (
    <button
      type="button"
      aria-label={`Ajouter ${member.name} à la liste d'envies`}
      onClick={() => onWish(member)}
      className="rounded-control border border-edge px-2.5 py-0.5 text-sm text-paper-dim transition hover:border-seam hover:text-paper"
    >
      Envie
    </button>
  );
}

/** The game's series: how much of it the collection holds, each game's state, and the missing ones to wish for. */
export function GameSeriesSection({ series, wishlistIds, onWish, onOpenGame }: GameSeriesSectionProps) {
  return (
    <section aria-labelledby="game-series-title" className="rounded-control border border-edge bg-plank px-4 py-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id="game-series-title" className="font-semiwide text-sm font-bold text-paper">
          Série : {series.name}
        </h2>
        <p className="text-sm text-dust">{describeSeriesProgress(series)}</p>
      </div>
      <ul className="divide-y divide-edge">
        {series.members.map((member) => (
          <li key={member.igdbGameId} aria-label={member.name} className="flex items-center justify-between gap-3 py-2">
            <div className="flex min-w-0 items-baseline gap-2">
              {member.owned ? (
                <button
                  type="button"
                  onClick={() => onOpenGame(member.owned!.appId)}
                  className="truncate text-left text-sm font-semibold text-paper-dim transition hover:text-paper"
                >
                  {member.name}
                </button>
              ) : (
                <span className="truncate text-sm text-paper-dim">{member.name}</span>
              )}
              {member.releaseDate && <span className="shrink-0 text-sm tabular-nums text-faint">{member.releaseDate.slice(0, 4)}</span>}
            </div>
            <MemberState member={member} wishlistIds={wishlistIds} onWish={onWish} />
          </li>
        ))}
      </ul>
    </section>
  );
}
