// __tests__/lib/library/tonight-pick.test.ts
import { describe, it, expect } from "vitest";
import { describePick, pickGamesForTonight, remainingHours } from "@/lib/library/tonight-pick";
import { makeOwnedGame } from "../../helpers/gameFixtures";
import type { GameDurations } from "@/lib/types";

const hours = (h: number): GameDurations => ({ hastilySeconds: null, normallySeconds: h * 3600, completelySeconds: null });

describe("remainingHours", () => {
  it("takes the hours already played off the usual duration", () => {
    expect(remainingHours(makeOwnedGame({ playtimeHours: 6 }), { steam_620: hours(10) })).toBe(4);
  });

  it("knows nothing without a duration, or once the usual duration is already spent", () => {
    expect(remainingHours(makeOwnedGame(), {})).toBeNull();
    expect(remainingHours(makeOwnedGame({ playtimeHours: 14 }), { steam_620: hours(10) })).toBeNull();
  });

  it("counts a game never played as its whole duration", () => {
    expect(remainingHours(makeOwnedGame({ playtimeHours: undefined }), { steam_620: hours(10) })).toBe(10);
  });
});

describe("pickGamesForTonight", () => {
  const nearlyDone = makeOwnedGame({ appId: 1, name: "Nearly done", status: "in-progress", playtimeHours: 9, lastPlayed: "2026-11-01" });
  const longRun = makeOwnedGame({ appId: 2, name: "Long run", status: "in-progress", playtimeHours: 5, lastPlayed: "2026-11-10" });
  const pausedShort = makeOwnedGame({ appId: 3, name: "Paused short", status: "paused", playtimeHours: 2 });
  const pausedLong = makeOwnedGame({ appId: 4, name: "Paused long", status: "paused", playtimeHours: 2 });
  const queuedLong = makeOwnedGame({ appId: 5, name: "Queued long", status: "backlog", backlogRank: 1 });
  const queuedShort = makeOwnedGame({ appId: 6, name: "Queued short", status: "backlog", backlogRank: 2 });
  const unqueued = makeOwnedGame({ appId: 7, name: "Unqueued", status: "backlog" });
  const finished = makeOwnedGame({ appId: 8, name: "Finished", status: "completed" });
  const durations = {
    steam_1: hours(10),
    steam_2: hours(60),
    steam_3: hours(4),
    steam_4: hours(40),
    steam_5: hours(50),
    steam_6: hours(3),
  };
  const games = [finished, unqueued, queuedShort, queuedLong, pausedLong, pausedShort, longRun, nearlyDone];

  it("offers first what can be finished, then what is being played, then short games, then the queue", () => {
    const picks = pickGamesForTonight(games, durations, "evening");

    expect(picks.map((p) => [p.game.name, p.reason])).toEqual([
      ["Nearly done", "finish-tonight"],
      ["Paused short", "finish-tonight"],
      ["Long run", "keep-going"],
      ["Queued short", "short-enough"],
      ["Queued long", "next-in-queue"],
      ["Unqueued", "next-in-queue"],
    ]);
  });

  it("finishes nothing in an hour that takes longer, and leaves long paused games aside", () => {
    const picks = pickGamesForTonight(games, durations, "hour");

    expect(picks.map((p) => [p.game.name, p.reason])).toEqual([
      ["Nearly done", "finish-tonight"],
      ["Long run", "keep-going"],
      ["Queued long", "next-in-queue"],
      ["Queued short", "next-in-queue"],
      ["Unqueued", "next-in-queue"],
    ]);
  });

  it("keeps the most recently played game first among those being played", () => {
    const picks = pickGamesForTonight([nearlyDone, longRun], {}, "weekend");

    expect(picks.map((p) => p.game.name)).toEqual(["Long run", "Nearly done"]);
  });

  it("gives the remaining time of each pick", () => {
    const [first] = pickGamesForTonight([nearlyDone], durations, "evening");

    expect(first.remainingHours).toBe(1);
  });
});

describe("describePick", () => {
  const game = makeOwnedGame();

  it("explains why each game is offered", () => {
    expect(describePick({ game, reason: "finish-tonight", remainingHours: 2 })).toBe("Tu peux le finir : il reste environ 2 h");
    expect(describePick({ game, reason: "finish-tonight", remainingHours: 0.4 })).toBe("Tu peux le finir : il reste moins d'1 h");
    expect(describePick({ game, reason: "keep-going", remainingHours: 30 })).toBe("Tu y joues en ce moment · encore environ 30 h");
    expect(describePick({ game, reason: "keep-going", remainingHours: null })).toBe("Tu y joues en ce moment");
    expect(describePick({ game, reason: "short-enough", remainingHours: 3 })).toBe("Assez court pour tenir dedans : environ 3 h");
    expect(describePick({ game, reason: "next-in-queue", remainingHours: null })).toBe("Le prochain de ta file");
  });
});
