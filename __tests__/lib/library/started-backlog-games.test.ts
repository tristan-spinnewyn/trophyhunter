// __tests__/lib/library/started-backlog-games.test.ts
import { describe, it, expect } from "vitest";
import { findStartedBacklogGames } from "@/lib/library/started-backlog-games";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const QUEUED_ON = "2026-11-01T10:00:00.000Z";

describe("findStartedBacklogGames", () => {
  it("finds the backlog games played since they were put in the backlog", () => {
    const started = makeOwnedGame({ appId: 1, status: "backlog", statusChangedAt: QUEUED_ON, lastPlayed: "2026-11-05T20:00:00.000Z" });
    const waiting = makeOwnedGame({ appId: 2, status: "backlog", statusChangedAt: QUEUED_ON, lastPlayed: "2026-10-20T20:00:00.000Z" });
    const neverPlayed = makeOwnedGame({ appId: 3, status: "backlog", statusChangedAt: QUEUED_ON });

    expect(findStartedBacklogGames([started, waiting, neverPlayed])).toEqual([started]);
  });

  it("only looks at the backlog", () => {
    const playing = makeOwnedGame({ status: "in-progress", statusChangedAt: QUEUED_ON, lastPlayed: "2026-11-05T20:00:00.000Z" });
    const unsorted = makeOwnedGame({ statusChangedAt: QUEUED_ON, lastPlayed: "2026-11-05T20:00:00.000Z" });

    expect(findStartedBacklogGames([playing, unsorted])).toEqual([]);
  });

  it("stays silent when it cannot tell: no status date, or an unreadable one", () => {
    const noDate = makeOwnedGame({ status: "backlog", lastPlayed: "2026-11-05T20:00:00.000Z" });
    const brokenStatusDate = makeOwnedGame({ status: "backlog", statusChangedAt: "soon", lastPlayed: "2026-11-05T20:00:00.000Z" });
    const brokenSession = makeOwnedGame({ status: "backlog", statusChangedAt: QUEUED_ON, lastPlayed: "yesterday" });

    expect(findStartedBacklogGames([noDate, brokenStatusDate, brokenSession])).toEqual([]);
  });

  it("lists the most recently played game first", () => {
    const earlier = makeOwnedGame({ appId: 1, status: "backlog", statusChangedAt: QUEUED_ON, lastPlayed: "2026-11-03T20:00:00.000Z" });
    const later = makeOwnedGame({ appId: 2, status: "backlog", statusChangedAt: QUEUED_ON, lastPlayed: "2026-11-08T20:00:00.000Z" });

    expect(findStartedBacklogGames([earlier, later]).map((g) => g.appId)).toEqual([2, 1]);
  });
});
