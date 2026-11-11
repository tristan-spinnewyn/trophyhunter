// __tests__/lib/igdb/backlog-time-to-beat.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { lookupTimeToBeat, isIgdbConfigured } = vi.hoisted(() => ({
  lookupTimeToBeat: vi.fn(),
  isIgdbConfigured: vi.fn(() => true),
}));
vi.mock("@/lib/igdb/time-to-beat-lookup", () => ({ lookupTimeToBeat }));
vi.mock("@/lib/igdb/igdb-client", () => ({ isIgdbConfigured }));

import { initDatabase, setDbForTesting, createUser, saveUserOwnedGames } from "@/lib/db";
import { getBacklogTimeToBeat } from "@/lib/igdb/backlog-time-to-beat";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const portal = { igdbGameId: 72, hastilySeconds: 28800, normallySeconds: 36000, completelySeconds: null };

describe("getBacklogTimeToBeat", () => {
  let userId: string;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T12:00:00.000Z"));
    setDbForTesting(initDatabase(":memory:"));
    userId = createUser("Planner", "password123").id;
    saveUserOwnedGames(userId, [
      makeOwnedGame({ appId: 620, name: "Portal 2", status: "backlog" }),
      makeOwnedGame({ appId: 9, name: "Obscure", platform: "epic", status: "backlog" }),
      makeOwnedGame({ appId: 400, name: "Portal", status: "completed" }),
    ]);
    lookupTimeToBeat.mockReset();
    isIgdbConfigured.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    setDbForTesting(null);
  });

  it("looks up the backlog games only, and returns the durations it found", async () => {
    lookupTimeToBeat.mockResolvedValue(new Map([["steam_620", portal], ["epic_9", null]]));

    const durations = await getBacklogTimeToBeat(userId);

    expect(lookupTimeToBeat).toHaveBeenCalledWith([
      expect.objectContaining({ appId: 620, platform: "steam", name: "Portal 2" }),
      expect.objectContaining({ appId: 9, platform: "epic", name: "Obscure" }),
    ]);
    expect(durations).toEqual({ steam_620: { hastilySeconds: 28800, normallySeconds: 36000, completelySeconds: null } });
  });

  it("answers from the cache, for found games and for games IGDB does not know", async () => {
    lookupTimeToBeat.mockResolvedValue(new Map([["steam_620", portal], ["epic_9", null]]));
    await getBacklogTimeToBeat(userId);
    lookupTimeToBeat.mockClear();

    vi.setSystemTime(new Date("2026-11-15T12:00:00.000Z"));
    const durations = await getBacklogTimeToBeat(userId);

    expect(lookupTimeToBeat).not.toHaveBeenCalled();
    expect(Object.keys(durations)).toEqual(["steam_620"]);
  });

  it("asks again about an unknown game after a week, and about a found one after a month", async () => {
    lookupTimeToBeat.mockResolvedValue(new Map([["steam_620", portal], ["epic_9", null]]));
    await getBacklogTimeToBeat(userId);

    vi.setSystemTime(new Date("2026-11-19T12:00:00.000Z"));
    lookupTimeToBeat.mockResolvedValue(new Map([["epic_9", null]]));
    await getBacklogTimeToBeat(userId);
    expect(lookupTimeToBeat).toHaveBeenLastCalledWith([expect.objectContaining({ appId: 9 })]);

    vi.setSystemTime(new Date("2026-12-12T12:00:00.000Z"));
    lookupTimeToBeat.mockResolvedValue(new Map());
    await getBacklogTimeToBeat(userId);
    expect(lookupTimeToBeat).toHaveBeenLastCalledWith([expect.objectContaining({ appId: 620 }), expect.objectContaining({ appId: 9 })]);
  });

  it("still answers from the cache when IGDB fails", async () => {
    lookupTimeToBeat.mockResolvedValue(new Map([["steam_620", portal]]));
    await getBacklogTimeToBeat(userId);
    lookupTimeToBeat.mockRejectedValue(new Error("IGDB games query failed: 429"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(Object.keys(await getBacklogTimeToBeat(userId))).toEqual(["steam_620"]);
  });

  it("asks IGDB nothing when its keys are not set", async () => {
    isIgdbConfigured.mockReturnValue(false);

    expect(await getBacklogTimeToBeat(userId)).toEqual({});
    expect(lookupTimeToBeat).not.toHaveBeenCalled();
  });
});
