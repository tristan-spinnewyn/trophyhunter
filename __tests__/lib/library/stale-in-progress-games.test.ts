// __tests__/lib/library/stale-in-progress-games.test.ts
import { describe, it, expect } from "vitest";
import { findStaleInProgressGames, lastActivityAt } from "@/lib/library/stale-in-progress-games";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const NOW = new Date("2026-11-11T12:00:00.000Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

describe("findStaleInProgressGames", () => {
  it("finds in-progress games without a session for longer than the threshold, oldest first", () => {
    const forgotten = makeOwnedGame({ appId: 1, status: "in-progress", statusChangedAt: daysAgo(90), lastPlayed: daysAgo(50) });
    const older = makeOwnedGame({ appId: 2, status: "in-progress", statusChangedAt: daysAgo(120), lastPlayed: daysAgo(80) });
    const active = makeOwnedGame({ appId: 3, status: "in-progress", statusChangedAt: daysAgo(90), lastPlayed: daysAgo(3) });

    expect(findStaleInProgressGames([forgotten, older, active], 6, NOW)).toEqual([older, forgotten]);
  });

  it("counts from the last time the status was chosen, so 'still playing' resets the clock", () => {
    const confirmed = makeOwnedGame({ status: "in-progress", statusChangedAt: daysAgo(2), lastPlayed: daysAgo(200) });

    expect(findStaleInProgressGames([confirmed], 6, NOW)).toEqual([]);
  });

  it("uses the status date when the platform reports no session", () => {
    const noSession = makeOwnedGame({ status: "in-progress", statusChangedAt: daysAgo(60) });

    expect(findStaleInProgressGames([noSession], 6, NOW)).toEqual([noSession]);
  });

  it("only looks at in-progress games", () => {
    const paused = makeOwnedGame({ status: "paused", statusChangedAt: daysAgo(200) });

    expect(findStaleInProgressGames([paused], 6, NOW)).toEqual([]);
  });

  it("stays silent when it cannot tell", () => {
    const noDates = makeOwnedGame({ status: "in-progress" });
    const broken = makeOwnedGame({ status: "in-progress", statusChangedAt: "soon", lastPlayed: "yesterday" });

    expect(findStaleInProgressGames([noDates, broken], 6, NOW)).toEqual([]);
  });
});

describe("lastActivityAt", () => {
  it("picks the later of the last session and the status choice", () => {
    expect(lastActivityAt({ lastPlayed: "2026-10-01T00:00:00.000Z", statusChangedAt: "2026-09-01T00:00:00.000Z" })).toBe("2026-10-01T00:00:00.000Z");
    expect(lastActivityAt({ lastPlayed: "2026-08-01T00:00:00.000Z", statusChangedAt: "2026-09-01T00:00:00.000Z" })).toBe("2026-09-01T00:00:00.000Z");
  });

  it("ignores unreadable dates", () => {
    expect(lastActivityAt({ lastPlayed: "soon", statusChangedAt: "2026-09-01T00:00:00.000Z" })).toBe("2026-09-01T00:00:00.000Z");
    expect(lastActivityAt({})).toBeUndefined();
  });
});
