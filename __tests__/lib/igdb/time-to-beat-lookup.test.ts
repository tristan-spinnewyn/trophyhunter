// __tests__/lib/igdb/time-to-beat-lookup.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { igdbQuery } = vi.hoisted(() => ({ igdbQuery: vi.fn() }));
vi.mock("@/lib/igdb/igdb-client", () => ({ igdbQuery }));

import { lookupTimeToBeat, MAX_NAME_LOOKUPS } from "@/lib/igdb/time-to-beat-lookup";

const noPause = async () => {};

/** Answers each IGDB endpoint from a table, recording the queries. */
function answer(byEndpoint: Record<string, (query: string) => unknown[]>) {
  igdbQuery.mockImplementation(async (endpoint: string, query: string) => byEndpoint[endpoint]?.(query) ?? []);
}

describe("lookupTimeToBeat", () => {
  beforeEach(() => igdbQuery.mockReset());

  it("finds Steam and GOG games by their store id, then reads their durations", async () => {
    answer({
      external_games: (q) =>
        q.includes("external_game_source = 1")
          ? [{ game: 72, uid: "620", external_game_source: 1 }]
          : [{ game: 1020, uid: "1207658924", external_game_source: 5 }],
      game_time_to_beats: () => [
        { game_id: 72, hastily: 28800, normally: 36000, completely: 72000 },
        { game_id: 1020, hastily: 3600 },
      ],
    });

    const result = await lookupTimeToBeat(
      [
        { appId: 620, platform: "steam", name: "Portal 2" },
        { appId: 1207658924, platform: "gog", name: "Unreal" },
      ],
      { pause: noPause }
    );

    expect(result.get("steam_620")).toEqual({ igdbGameId: 72, hastilySeconds: 28800, normallySeconds: 36000, completelySeconds: 72000 });
    expect(result.get("gog_1207658924")).toEqual({ igdbGameId: 1020, hastilySeconds: 3600, normallySeconds: null, completelySeconds: null });
    expect(igdbQuery).toHaveBeenCalledWith("external_games", expect.stringContaining('uid = ("620")'));
    expect(igdbQuery).toHaveBeenCalledWith("game_time_to_beats", expect.stringContaining("game_id = (72,1020)"));
  });

  it("finds other games by their exact name, ignoring case and trademark signs", async () => {
    answer({
      games: () => [
        { id: 5, name: "Halo Infinite: Campaign Edition" },
        { id: 6, name: "HALO Infinite" },
      ],
      game_time_to_beats: () => [{ game_id: 6, normally: 54000 }],
    });

    const result = await lookupTimeToBeat([{ appId: 9, platform: "xbox", name: "Halo Infinite™" }], { pause: noPause });

    expect(result.get("xbox_9")?.igdbGameId).toBe(6);
    expect(igdbQuery).toHaveBeenCalledWith("games", expect.stringContaining('search "Halo Infinite™"'));
  });

  it("escapes quotes in a searched name", async () => {
    answer({ games: () => [] });

    await lookupTimeToBeat([{ appId: 9, platform: "epic", name: 'The "Game"' }], { pause: noPause });

    expect(igdbQuery).toHaveBeenCalledWith("games", expect.stringContaining('search "The \\"Game\\""'));
  });

  it("falls back on the name for a store game IGDB does not know by id", async () => {
    answer({ external_games: () => [], games: () => [{ id: 8, name: "Tunic" }], game_time_to_beats: () => [] });

    const result = await lookupTimeToBeat([{ appId: 553420, platform: "steam", name: "Tunic" }], { pause: noPause });

    expect(result.get("steam_553420")).toEqual({ igdbGameId: 8, hastilySeconds: null, normallySeconds: null, completelySeconds: null });
  });

  it("records a game IGDB does not know at all as unknown", async () => {
    answer({ games: () => [{ id: 1, name: "Something else" }] });

    const result = await lookupTimeToBeat([{ appId: 9, platform: "epic", name: "Obscure Game" }], { pause: noPause });

    expect(result.get("epic_9")).toBeNull();
  });

  it("searches only a few names per call, pausing between them, and leaves the rest for later", async () => {
    answer({ games: () => [] });
    const pause = vi.fn(async () => {});
    const games = Array.from({ length: MAX_NAME_LOOKUPS + 2 }, (_, i) => ({ appId: i, platform: "epic" as const, name: `Game ${i}` }));

    const result = await lookupTimeToBeat(games, { pause });

    expect(result.size).toBe(MAX_NAME_LOOKUPS);
    expect(igdbQuery.mock.calls.filter(([e]) => e === "games")).toHaveLength(MAX_NAME_LOOKUPS);
    expect(pause).toHaveBeenCalledTimes(MAX_NAME_LOOKUPS);
  });

  it("asks nothing for an empty list", async () => {
    expect((await lookupTimeToBeat([], { pause: noPause })).size).toBe(0);
    expect(igdbQuery).not.toHaveBeenCalled();
  });
});
