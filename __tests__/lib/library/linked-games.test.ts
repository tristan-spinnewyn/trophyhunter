// __tests__/lib/library/linked-games.test.ts
import { describe, it, expect } from "vitest";
import { choosePrimaryGame, isMergedGroup, mergeLinkedGames } from "@/lib/library/linked-games";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const steam = makeOwnedGame({ appId: 1, platform: "steam", name: "Hades", status: "completed", playtimeHours: 30, lastPlayed: "2026-05-01" });
const xbox = makeOwnedGame({
  appId: 2, platform: "xbox", name: "Hades", status: "unsorted", playtimeHours: 4, lastPlayed: "2026-09-01",
  mergedInto: { platform: "steam", appId: 1 },
});
const gog = makeOwnedGame({ appId: 3, platform: "gog", name: "Hades", playtimeHours: undefined, mergedInto: { platform: "steam", appId: 1 } });
const other = makeOwnedGame({ appId: 9, platform: "steam", name: "Celeste" });

describe("mergeLinkedGames", () => {
  it("shows each merged game once, as its primary copy with the time of every copy", () => {
    const merged = mergeLinkedGames([xbox, steam, other, gog]);

    expect(merged.map((g) => `${g.platform}_${g.appId}`)).toEqual(["steam_1", "steam_9"]);
    expect(merged[0]).toMatchObject({
      status: "completed",
      playtimeHours: 34,
      lastPlayed: "2026-09-01",
      linkedCopies: [{ platform: "xbox", appId: 2 }, { platform: "gog", appId: 3 }],
    });
  });

  it("keeps a copy whose primary is not in the list", () => {
    expect(mergeLinkedGames([xbox, other]).map((g) => g.appId)).toEqual([2, 9]);
  });

  it("leaves a list without links as it is", () => {
    const games = [steam, other];

    expect(mergeLinkedGames(games)).toEqual(games);
  });
});

describe("choosePrimaryGame", () => {
  it("keeps the copy whose status was chosen, then the one played the most", () => {
    const unsortedLong = makeOwnedGame({ appId: 1, platform: "steam", status: "unsorted", playtimeHours: 50 });
    const sortedShort = makeOwnedGame({ appId: 2, platform: "xbox", status: "in-progress", playtimeHours: 2 });
    const sortedLong = makeOwnedGame({ appId: 3, platform: "gog", status: "paused", playtimeHours: 10 });

    expect(choosePrimaryGame([unsortedLong, sortedShort, sortedLong]).appId).toBe(3);
    expect(choosePrimaryGame([unsortedLong, makeOwnedGame({ appId: 4, platform: "epic", status: "unsorted" })]).appId).toBe(1);
  });
});

describe("isMergedGroup", () => {
  it("tells a group already merged from one still to merge", () => {
    expect(isMergedGroup([steam, { ...xbox }])).toBe(true);
    expect(isMergedGroup([steam, { ...xbox, mergedInto: undefined }])).toBe(false);
  });
});
