// lib/series/series.types.ts
import type { GameStatus, PlatformType } from "@/lib/types";

/** One game of a series, as IGDB lists it. */
export interface SeriesMember {
  readonly igdbGameId: number;
  readonly name: string;
  readonly releaseDate?: string;
  /** Its Steam app id when IGDB knows it, so it can be wished for. */
  readonly steamAppId?: number;
}

/** A series (IGDB collection, else franchise) with its games, oldest release first. */
export interface GameSeries {
  readonly name: string;
  readonly members: readonly SeriesMember[];
}

export interface SeriesMemberView extends SeriesMember {
  /** The collection's copy of this game, when owned. */
  readonly owned?: { readonly appId: number; readonly platform: PlatformType; readonly status: GameStatus };
}

/** A series compared with the collection. */
export interface SeriesView {
  readonly name: string;
  readonly members: readonly SeriesMemberView[];
  readonly total: number;
  readonly ownedCount: number;
  readonly finishedCount: number;
}
