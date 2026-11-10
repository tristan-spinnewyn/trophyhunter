// __tests__/lib/library/backlog-order.test.ts
import { describe, it, expect } from "vitest";
import { getQueuePositions, rankToPlayNext, sortBacklogQueue } from "@/lib/library/backlog-order";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const game = (appId: number, backlogRank?: number) => makeOwnedGame({ appId, status: "backlog", backlogRank });

describe("sortBacklogQueue", () => {
  it("puts queued games first, lowest rank first, and leaves the others in their incoming order", () => {
    const sorted = sortBacklogQueue([game(1), game(2, 5), game(3), game(4, -1), game(5, 0)]);

    expect(sorted.map((g) => g.appId)).toEqual([4, 5, 2, 1, 3]);
  });

  it("does not mutate the list it receives", () => {
    const games = [game(1), game(2, 0)];
    sortBacklogQueue(games);

    expect(games.map((g) => g.appId)).toEqual([1, 2]);
  });
});

describe("rankToPlayNext", () => {
  it("starts the queue at zero", () => {
    expect(rankToPlayNext([game(1), game(2)])).toBe(0);
  });

  it("goes just ahead of the current head of the queue", () => {
    expect(rankToPlayNext([game(1, 3), game(2, -2), game(3)])).toBe(-3);
  });
});

describe("getQueuePositions", () => {
  it("numbers the queued games from 1 and leaves the others out", () => {
    const positions = getQueuePositions([game(1), game(2, 5), game(4, -1)]);

    expect(positions.get("steam_4")).toBe(1);
    expect(positions.get("steam_2")).toBe(2);
    expect(positions.has("steam_1")).toBe(false);
  });
});
