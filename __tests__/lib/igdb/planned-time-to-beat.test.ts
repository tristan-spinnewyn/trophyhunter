// __tests__/lib/igdb/planned-time-to-beat.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { lookupTimeToBeat, isIgdbConfigured } = vi.hoisted(() => ({
  lookupTimeToBeat: vi.fn(),
  isIgdbConfigured: vi.fn(() => true),
}));
vi.mock("@/lib/igdb/time-to-beat-lookup", () => ({ lookupTimeToBeat }));
vi.mock("@/lib/igdb/igdb-client", () => ({ isIgdbConfigured }));

import { initDatabase, setDbForTesting, createUser, saveUserOwnedGames } from "@/lib/db";
import { getPlannedTimeToBeat } from "@/lib/igdb/planned-time-to-beat";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const portal = { igdbGameId: 72, hastilySeconds: 28800, normallySeconds: 36000, completelySeconds: null };

describe("getPlannedTimeToBeat", () => {
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

  it("also looks up the games being played or paused, whose remaining time matters", async () => {
    saveUserOwnedGames(userId, [
      makeOwnedGame({ appId: 70, name: "Half-Life", status: "in-progress" }),
      makeOwnedGame({ appId: 71, name: "Opposing Force", status: "paused" }),
    ]);
    lookupTimeToBeat.mockResolvedValue(new Map());

    await getPlannedTimeToBeat(userId);

    const asked = (lookupTimeToBeat.mock.calls[0][0] as { appId: number }[]).map((g) => g.appId).sort((a, b) => a - b);
    expect(asked).toEqual([9, 70, 71, 620]);
  });

  it("looks up the games ahead only, and returns the durations it found", async () => {
    lookupTimeToBeat.mockResolvedValue(new Map([["steam_620", portal], ["epic_9", null]]));

    const durations = await getPlannedTimeToBeat(userId);

    expect(lookupTimeToBeat).toHaveBeenCalledWith([
      expect.objectContaining({ appId: 620, platform: "steam", name: "Portal 2" }),
      expect.objectContaining({ appId: 9, platform: "epic", name: "Obscure" }),
    ]);
    expect(durations).toEqual({ steam_620: { hastilySeconds: 28800, normallySeconds: 36000, completelySeconds: null } });
  });

  it("answers from the cache, for found games and for games IGDB does not know", async () => {
    lookupTimeToBeat.mockResolvedValue(new Map([["steam_620", portal], ["epic_9", null]]));
    await getPlannedTimeToBeat(userId);
    lookupTimeToBeat.mockClear();

    vi.setSystemTime(new Date("2026-11-15T12:00:00.000Z"));
    const durations = await getPlannedTimeToBeat(userId);

    expect(lookupTimeToBeat).not.toHaveBeenCalled();
    expect(Object.keys(durations)).toEqual(["steam_620"]);
  });

  it("asks again about an unknown game after a week, and about a found one after a month", async () => {
    lookupTimeToBeat.mockResolvedValue(new Map([["steam_620", portal], ["epic_9", null]]));
    await getPlannedTimeToBeat(userId);

    vi.setSystemTime(new Date("2026-11-19T12:00:00.000Z"));
    lookupTimeToBeat.mockResolvedValue(new Map([["epic_9", null]]));
    await getPlannedTimeToBeat(userId);
    expect(lookupTimeToBeat).toHaveBeenLastCalledWith([expect.objectContaining({ appId: 9 })]);

    vi.setSystemTime(new Date("2026-12-12T12:00:00.000Z"));
    lookupTimeToBeat.mockResolvedValue(new Map());
    await getPlannedTimeToBeat(userId);
    expect(lookupTimeToBeat).toHaveBeenLastCalledWith([expect.objectContaining({ appId: 620 }), expect.objectContaining({ appId: 9 })]);
  });

  it("still answers from the cache when IGDB fails", async () => {
    lookupTimeToBeat.mockResolvedValue(new Map([["steam_620", portal]]));
    await getPlannedTimeToBeat(userId);
    lookupTimeToBeat.mockRejectedValue(new Error("IGDB games query failed: 429"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(Object.keys(await getPlannedTimeToBeat(userId))).toEqual(["steam_620"]);
  });

  it("asks IGDB nothing when its keys are not set", async () => {
    isIgdbConfigured.mockReturnValue(false);

    expect(await getPlannedTimeToBeat(userId)).toEqual({});
    expect(lookupTimeToBeat).not.toHaveBeenCalled();
  });
});
