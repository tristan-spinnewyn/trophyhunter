// __tests__/lib/series/series-matching.test.ts
import { describe, it, expect } from "vitest";
import { describeSeriesProgress, matchSeriesMembers } from "@/lib/series/series-matching";
import type { GameSeries } from "@/lib/series/series.types";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const series: GameSeries = {
  name: "Dark Souls",
  members: [
    { igdbGameId: 1, name: "Dark Souls: Remastered", releaseDate: "2018-05-24T00:00:00.000Z", steamAppId: 570940 },
    { igdbGameId: 2, name: "Dark Souls II", releaseDate: "2014-03-11T00:00:00.000Z", steamAppId: 236430 },
    { igdbGameId: 3, name: "Dark Souls III", releaseDate: "2016-03-24T00:00:00.000Z" },
  ],
};

describe("matchSeriesMembers", () => {
  it("finds each member in the collection by Steam id, else by title", () => {
    const owned = [
      makeOwnedGame({ appId: 570940, platform: "steam", name: "DARK SOULS™: REMASTERED", status: "completed" }),
      makeOwnedGame({ appId: 77, platform: "xbox", name: "Dark Souls III", status: "in-progress" }),
      makeOwnedGame({ appId: 5, platform: "steam", name: "Elden Ring" }),
    ];

    const view = matchSeriesMembers(series, owned);

    expect(view.members.map((m) => [m.name, m.owned?.appId ?? null, m.owned?.status ?? null])).toEqual([
      ["Dark Souls: Remastered", 570940, "completed"],
      ["Dark Souls II", null, null],
      ["Dark Souls III", 77, "in-progress"],
    ]);
    expect(view).toMatchObject({ name: "Dark Souls", ownedCount: 2, finishedCount: 1 });
  });

  it("counts a game merged across platforms once", () => {
    const owned = [
      makeOwnedGame({ appId: 236430, platform: "steam", name: "Dark Souls II", status: "completed" }),
      makeOwnedGame({ appId: 9, platform: "xbox", name: "Dark Souls II", mergedInto: { platform: "steam", appId: 236430 } }),
    ];

    expect(matchSeriesMembers(series, owned)).toMatchObject({ ownedCount: 1, finishedCount: 1 });
  });
});

describe("describeSeriesProgress", () => {
  it("sums up how much of the series is in the collection and finished", () => {
    expect(describeSeriesProgress({ name: "Dark Souls", members: [], ownedCount: 2, finishedCount: 1, total: 3 })).toBe(
      "2 / 3 dans ta collection · 1 terminé"
    );
    expect(describeSeriesProgress({ name: "Dark Souls", members: [], ownedCount: 3, finishedCount: 3, total: 3 })).toBe(
      "3 / 3 dans ta collection · 3 terminés"
    );
    expect(describeSeriesProgress({ name: "Dark Souls", members: [], ownedCount: 1, finishedCount: 0, total: 3 })).toBe(
      "1 / 3 dans ta collection"
    );
  });
});
