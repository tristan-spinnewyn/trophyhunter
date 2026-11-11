// __tests__/lib/library/backlog-estimate.test.ts
import { describe, it, expect } from "vitest";
import { describeBacklogEstimate, estimateBacklog, PACE_WINDOW_DAYS } from "@/lib/library/backlog-estimate";
import type { GameDurations, PlaySession } from "@/lib/types";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const NOW = new Date("2026-11-11T12:00:00.000Z");
const HOUR = 3600;
const durations = (normally: number | null, hastily: number | null = null, completely: number | null = null): GameDurations => ({
  normallySeconds: normally === null ? null : normally * HOUR,
  hastilySeconds: hastily === null ? null : hastily * HOUR,
  completelySeconds: completely === null ? null : completely * HOUR,
});
const session = (minutes: number, daysAgo: number): PlaySession => ({
  appId: 1, platform: "steam", name: "Game", minutes,
  detectedAt: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
});

describe("estimateBacklog", () => {
  const backlog = [makeOwnedGame({ appId: 1 }), makeOwnedGame({ appId: 2 }), makeOwnedGame({ appId: 3 }), makeOwnedGame({ appId: 4 })];

  it("adds up the usual duration, else the quickest, else the full one, and counts the unknown ones", () => {
    const estimate = estimateBacklog(
      backlog,
      { steam_1: durations(10), steam_2: durations(null, 5), steam_3: durations(null, null, 30) },
      [],
      NOW
    );

    expect(estimate).toEqual({ totalHours: 45, unknownCount: 1, weeksAtPace: null });
  });

  it("divides by the hours played per week over the last 90 days", () => {
    const weeks = PACE_WINDOW_DAYS / 7;
    const sessions = [session(Math.round(weeks * 60 * 5), 10), session(600, PACE_WINDOW_DAYS + 5)];

    const estimate = estimateBacklog([makeOwnedGame({ appId: 1 })], { steam_1: durations(50) }, sessions, NOW);

    expect(estimate.weeksAtPace).toBeCloseTo(10, 1);
  });

  it("has no total when no duration is known", () => {
    expect(estimateBacklog(backlog, {}, [], NOW)).toEqual({ totalHours: 0, unknownCount: 4, weeksAtPace: null });
  });
});

describe("describeBacklogEstimate", () => {
  it("says the hours and the time it takes at the current pace, in months past two months", () => {
    expect(describeBacklogEstimate({ totalHours: 140, unknownCount: 0, weeksAtPace: 17.4 })).toBe("≈ 140 h · environ 4 mois à ton rythme");
  });

  it("says weeks under two months", () => {
    expect(describeBacklogEstimate({ totalHours: 12, unknownCount: 0, weeksAtPace: 3.2 })).toBe("≈ 12 h · environ 3 semaines à ton rythme");
    expect(describeBacklogEstimate({ totalHours: 2, unknownCount: 0, weeksAtPace: 0.3 })).toBe("≈ 2 h · environ 1 semaine à ton rythme");
  });

  it("mentions the games without a duration", () => {
    expect(describeBacklogEstimate({ totalHours: 30, unknownCount: 3, weeksAtPace: null })).toBe("≈ 30 h · dont 3 jeux sans durée connue");
    expect(describeBacklogEstimate({ totalHours: 30, unknownCount: 1, weeksAtPace: null })).toBe("≈ 30 h · dont 1 jeu sans durée connue");
  });

  it("says nothing without any known duration", () => {
    expect(describeBacklogEstimate({ totalHours: 0, unknownCount: 4, weeksAtPace: null })).toBeNull();
  });
});
