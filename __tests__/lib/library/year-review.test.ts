// __tests__/lib/library/year-review.test.ts
import { describe, it, expect } from "vitest";
import { buildYearReview, reviewYears } from "@/lib/library/year-review";
import type { PlaySession } from "@/lib/types";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const session = (appId: number, platform: PlaySession["platform"], minutes: number, detectedAt: string): PlaySession => ({
  appId, platform, name: `Game ${appId}`, minutes, detectedAt,
});

const hades = makeOwnedGame({ appId: 1, name: "Hades", status: "completed", completedAt: "2026-03-01T12:00:00.000Z", rating: 5, totalAchievements: 49, unlockedCount: 49 });
const celeste = makeOwnedGame({ appId: 2, name: "Celeste", status: "completed", completedAt: "2026-08-01T12:00:00.000Z", rating: 4 });
const oldFinish = makeOwnedGame({ appId: 3, name: "Portal", status: "completed", completedAt: "2025-05-01T12:00:00.000Z", rating: 5 });
const anthem = makeOwnedGame({ appId: 4, name: "Anthem", status: "abandoned", abandonedAt: "2026-02-01T12:00:00.000Z", rating: 1 });
const replayed = makeOwnedGame({ appId: 5, name: "Doom", status: "in-progress", completedAt: "2026-04-01T12:00:00.000Z" });

const games = [hades, celeste, oldFinish, anthem, replayed];
const sessions = [
  session(1, "steam", 600, "2026-02-10T20:00:00.000Z"),
  session(2, "gog", 300, "2026-07-10T20:00:00.000Z"),
  session(2, "gog", 420, "2026-07-20T20:00:00.000Z"),
  session(1, "steam", 900, "2025-12-31T20:00:00.000Z"),
];

describe("buildYearReview", () => {
  const review = buildYearReview(2026, games, sessions);

  it("lists the games finished that year, latest first, even those picked up again since", () => {
    expect(review.finished.map((g) => g.name)).toEqual(["Celeste", "Doom", "Hades"]);
  });

  it("lists the games abandoned that year", () => {
    expect(review.abandoned.map((g) => g.name)).toEqual(["Anthem"]);
  });

  it("adds up the hours of that year's sessions only", () => {
    expect(review.hoursPlayed).toBe(22);
  });

  it("names the most played game and platform of the year", () => {
    expect(review.mostPlayed).toMatchObject({ appId: 2, platform: "gog", minutes: 720 });
    expect(review.topPlatform).toEqual({ platform: "gog", hours: 12 });
  });

  it("counts the games finished at 100 % that year", () => {
    expect(review.perfectCount).toBe(1);
  });

  it("ranks the best-rated games finished or abandoned that year", () => {
    expect(review.bestRated.map((g) => g.name)).toEqual(["Hades", "Celeste", "Anthem"]);
  });

  it("falls back to the platform with the most finishes when no session is known", () => {
    const quiet = buildYearReview(2026, games, []);

    expect(quiet.hoursPlayed).toBe(0);
    expect(quiet.mostPlayed).toBeNull();
    expect(quiet.topPlatform).toEqual({ platform: "steam", hours: null });
  });

  it("is empty for a year without anything", () => {
    const empty = buildYearReview(2019, games, sessions);

    expect(empty).toMatchObject({ finished: [], abandoned: [], hoursPlayed: 0, mostPlayed: null, topPlatform: null, perfectCount: 0, bestRated: [] });
  });
});

describe("reviewYears", () => {
  it("offers every year with a finish, an abandon or a session, plus the current one, latest first", () => {
    expect(reviewYears(games, sessions, new Date("2027-01-15T00:00:00.000Z"))).toEqual([2027, 2026, 2025]);
  });
});

describe("buildYearReview: merged games", () => {
  it("counts a game finished on two merged platforms once", () => {
    const steam = makeOwnedGame({ appId: 1, name: "Hades", status: "completed", completedAt: "2026-03-01T00:00:00.000Z" });
    const xbox = makeOwnedGame({ appId: 2, platform: "xbox", name: "Hades", status: "completed", completedAt: "2026-04-01T00:00:00.000Z", mergedInto: { platform: "steam", appId: 1 } });

    expect(buildYearReview(2026, [steam, xbox], []).finished.map((g) => g.appId)).toEqual([1]);
  });
});
