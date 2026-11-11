// lib/series/series-matching.ts
import type { OwnedGame } from "@/lib/types";
import { normalizeGameTitle } from "@/lib/game-title";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import { mergeLinkedGames } from "@/lib/library/linked-games";
import type { GameSeries, SeriesMemberView, SeriesView } from "./series.types";

/** Finds each game of the series in the collection, by Steam id, else by title; a merged game counts once. */
export function matchSeriesMembers(series: GameSeries, ownedGames: readonly OwnedGame[]): SeriesView {
  const games = mergeLinkedGames(ownedGames);
  const members = series.members.map((member): SeriesMemberView => {
    const title = normalizeGameTitle(member.name);
    const match =
      games.find((g) => member.steamAppId !== undefined && g.platform === "steam" && g.appId === member.steamAppId) ??
      games.find((g) => normalizeGameTitle(g.name) === title);
    return match
      ? { ...member, owned: { appId: match.appId, platform: match.platform, status: resolveGameStatus(match.status) } }
      : { ...member };
  });
  return {
    name: series.name,
    members,
    total: members.length,
    ownedCount: members.filter((m) => m.owned).length,
    finishedCount: members.filter((m) => m.owned?.status === "completed").length,
  };
}

/** "2 / 3 dans ta collection · 1 terminé". */
export function describeSeriesProgress({ total, ownedCount, finishedCount }: SeriesView): string {
  const owned = `${ownedCount} / ${total} dans ta collection`;
  if (finishedCount === 0) return owned;
  return `${owned} · ${finishedCount} ${finishedCount > 1 ? "terminés" : "terminé"}`;
}
