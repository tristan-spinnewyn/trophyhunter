// __tests__/lib/library/backlog-order.test.ts
import { describe, it, expect } from "vitest";
import { getQueuePositions, mergeWithHiddenQueue, queueAfterMove, rankToPlayNext, sortBacklogQueue } from "@/lib/library/backlog-order";
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

describe("queueAfterMove", () => {
  const keys = (games: { appId: number; platform: string }[]) => games.map((g) => g.appId);

  it("moves a queued game to a new place in the queue", () => {
    const shelf = sortBacklogQueue([game(1, 0), game(2, 1), game(3, 2)]);

    expect(keys(queueAfterMove(shelf, 2, 0))).toEqual([3, 1, 2]);
  });

  it("queues a game dropped among the queued ones", () => {
    const shelf = sortBacklogQueue([game(1, 0), game(2, 1), game(3), game(4)]);

    expect(keys(queueAfterMove(shelf, 3, 1))).toEqual([1, 4, 2]);
  });

  it("queues every game up to where an unqueued game is dropped, so the shelf reads as the queue", () => {
    const shelf = sortBacklogQueue([game(1, 0), game(2), game(3), game(4)]);

    expect(keys(queueAfterMove(shelf, 3, 2))).toEqual([1, 2, 4]);
  });

  it("lets a queued game be pushed down, and keeps the queue as long as before", () => {
    const shelf = sortBacklogQueue([game(1, 0), game(2, 1), game(3)]);

    expect(keys(queueAfterMove(shelf, 0, 1))).toEqual([2, 1]);
  });

  it("changes nothing when a game is dropped where it was", () => {
    const shelf = sortBacklogQueue([game(1, 0), game(2)]);

    expect(keys(queueAfterMove(shelf, 1, 1))).toEqual([1]);
  });
});

describe("mergeWithHiddenQueue", () => {
  const ids = (games: { appId: number }[]) => games.map((g) => g.appId);

  it("keeps queued games hidden by a filter in their place, and reorders the visible ones around them", () => {
    const backlog = [game(1, 0), game(2, 1), game(3, 2)];
    const visible = [game(1, 0), game(3, 2)];

    expect(ids(mergeWithHiddenQueue(backlog, visible, [game(3, 2), game(1, 0)]))).toEqual([3, 2, 1]);
  });

  it("adds newly queued visible games after the queue", () => {
    const backlog = [game(1, 0), game(2, 1), game(4)];
    const visible = [game(1, 0), game(4)];

    expect(ids(mergeWithHiddenQueue(backlog, visible, [game(1, 0), game(4)]))).toEqual([1, 2, 4]);
  });

  it("is the visible queue itself when nothing is hidden", () => {
    const backlog = [game(1, 0), game(2, 1)];

    expect(ids(mergeWithHiddenQueue(backlog, backlog, [game(2, 1), game(1, 0)]))).toEqual([2, 1]);
  });
});
