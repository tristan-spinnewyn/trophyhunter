// __tests__/lib/library/session-feed.test.ts
import { describe, it, expect } from "vitest";
import { daysBefore, playedTimeLabel, recentWeekStart, sessionsSince, summarizeRecentPlay } from "@/lib/library/session-feed";
import type { PlaySession } from "@/lib/types";

function session(appId: number, minutes: number, detectedAt: string): PlaySession {
  return { appId, platform: "steam", name: `Game ${appId}`, minutes, detectedAt };
}

describe("playedTimeLabel", () => {
  it("says minutes under an hour", () => {
    expect(playedTimeLabel(45)).toBe("45 min");
  });

  it("says whole hours without minutes", () => {
    expect(playedTimeLabel(120)).toBe("2 h");
  });

  it("says hours and padded minutes", () => {
    expect(playedTimeLabel(125)).toBe("2 h 05");
  });
});

describe("recentWeekStart", () => {
  it("goes back seven days", () => {
    expect(recentWeekStart(new Date("2026-11-11T12:00:00.000Z"))).toBe("2026-11-04T12:00:00.000Z");
  });
});

describe("summarizeRecentPlay", () => {
  it("adds up the sessions of each game, most played first", () => {
    const summary = summarizeRecentPlay([
      session(1, 30, "2026-11-10T20:00:00.000Z"),
      session(2, 90, "2026-11-09T20:00:00.000Z"),
      session(1, 40, "2026-11-08T20:00:00.000Z"),
    ]);

    expect(summary.totalMinutes).toBe(160);
    expect(summary.games.map((g) => [g.appId, g.minutes])).toEqual([[2, 90], [1, 70]]);
    expect(summary.games[1].lastDetectedAt).toBe("2026-11-10T20:00:00.000Z");
  });

  it("keeps the same id on two platforms apart", () => {
    const summary = summarizeRecentPlay([
      session(1, 30, "2026-11-10T20:00:00.000Z"),
      { ...session(1, 20, "2026-11-10T21:00:00.000Z"), platform: "gog" },
    ]);

    expect(summary.games).toHaveLength(2);
  });

  it("is empty without sessions", () => {
    expect(summarizeRecentPlay([])).toEqual({ totalMinutes: 0, games: [] });
  });
});

describe("daysBefore", () => {
  it("goes back the given number of days", () => {
    expect(daysBefore(new Date("2026-11-11T12:00:00.000Z"), 90)).toBe("2026-08-13T12:00:00.000Z");
  });
});

describe("sessionsSince", () => {
  it("keeps the sessions detected at or after the date", () => {
    const kept = session(1, 30, "2026-11-10T20:00:00.000Z");
    const old = session(2, 30, "2026-10-01T20:00:00.000Z");

    expect(sessionsSince([kept, old], "2026-11-04T12:00:00.000Z")).toEqual([kept]);
  });
});
