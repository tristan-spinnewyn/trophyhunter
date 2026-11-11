// __tests__/lib/series/game-series.services.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { isIgdbConfigured } = vi.hoisted(() => ({ isIgdbConfigured: vi.fn(() => true) }));
vi.mock("@/lib/igdb/igdb-client", () => ({ isIgdbConfigured, igdbQuery: vi.fn() }));

import { initDatabase, setDbForTesting, createUser, saveUserOwnedGames } from "@/lib/db";
import { saveTimeToBeat } from "@/lib/db/time-to-beat";
import { getSeriesForGame } from "@/lib/series/game-series.services";
import type { resolveIgdbGameIds } from "@/lib/igdb/igdb-game-resolver";
import type { lookupGameSeries } from "@/lib/igdb/series-lookup";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const now = new Date("2027-03-10T12:00:00.000Z");
const later = (days: number) => new Date(now.getTime() + days * 86_400_000);
const series = {
  name: "Portal",
  members: [
    { igdbGameId: 71, name: "Portal", steamAppId: 400 },
    { igdbGameId: 72, name: "Portal 2", steamAppId: 620 },
  ],
};

describe("getSeriesForGame", () => {
  let userId: string;
  let resolve: ReturnType<typeof vi.fn<typeof resolveIgdbGameIds>>;
  let lookup: ReturnType<typeof vi.fn<typeof lookupGameSeries>>;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    userId = createUser("SeriesUser", "password123").id;
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 620, name: "Portal 2", status: "completed" })]);
    resolve = vi.fn<typeof resolveIgdbGameIds>().mockResolvedValue({ ids: new Map([["steam_620", 72]]), looked: new Set(["steam_620"]) });
    lookup = vi.fn<typeof lookupGameSeries>().mockResolvedValue(series);
    isIgdbConfigured.mockReturnValue(true);
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  const ask = (at = now) => getSeriesForGame(userId, { platform: "steam", appId: 620 }, at, { resolve, lookup });

  it("finds the game's series and compares it with the collection", async () => {
    const view = await ask();

    expect(lookup).toHaveBeenCalledWith(72);
    expect(view).toMatchObject({ name: "Portal", total: 2, ownedCount: 1, finishedCount: 1 });
  });

  it("answers from the cache for a month, then asks again", async () => {
    await ask();
    await ask(later(29));
    expect(lookup).toHaveBeenCalledTimes(1);

    await ask(later(31));
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  it("reuses the IGDB id already known from the durations", async () => {
    saveTimeToBeat(new Map([["steam_620", { igdbGameId: 72, hastilySeconds: null, normallySeconds: null, completelySeconds: null }]]), now.toISOString());

    await ask();

    expect(resolve).not.toHaveBeenCalled();
    expect(lookup).toHaveBeenCalledWith(72);
  });

  it("remembers for a week that a game has no series", async () => {
    lookup.mockResolvedValue(null);

    expect(await ask()).toBeNull();
    await ask(later(6));
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it("asks nothing for a game outside the collection, unknown to IGDB, or without IGDB keys", async () => {
    expect(await getSeriesForGame(userId, { platform: "steam", appId: 1 }, now, { resolve, lookup })).toBeNull();

    resolve.mockResolvedValue({ ids: new Map(), looked: new Set(["steam_620"]) });
    expect(await ask()).toBeNull();
    expect(lookup).not.toHaveBeenCalled();

    isIgdbConfigured.mockReturnValue(false);
    expect(await ask(later(40))).toBeNull();
  });
});
