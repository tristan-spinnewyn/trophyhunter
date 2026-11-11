// __tests__/lib/igdb/series-lookup.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { igdbQuery } = vi.hoisted(() => ({ igdbQuery: vi.fn() }));
vi.mock("@/lib/igdb/igdb-client", () => ({ igdbQuery }));

import { lookupGameSeries } from "@/lib/igdb/series-lookup";

function answer(byQuery: (endpoint: string, query: string) => unknown[]) {
  igdbQuery.mockImplementation(async (endpoint: string, query: string) => byQuery(endpoint, query));
}

describe("lookupGameSeries", () => {
  beforeEach(() => igdbQuery.mockReset());

  it("lists the games of the game's series, oldest first, with their Steam id", async () => {
    answer((endpoint, query) => {
      if (endpoint === "games" && query.includes("fields collections,franchises")) return [{ id: 2, collections: [40], franchises: [7] }];
      if (endpoint === "collections") return [{ id: 40, name: "Dark Souls", games: [1, 2, 3] }];
      if (endpoint === "games") {
        return [
          { id: 2, name: "Dark Souls II", first_release_date: 1_394_496_000 },
          { id: 1, name: "Dark Souls", first_release_date: 1_316_649_600 },
          { id: 3, name: "Dark Souls IV" },
        ];
      }
      if (endpoint === "external_games") return [{ game: 2, uid: "236430" }];
      return [];
    });

    const series = await lookupGameSeries(2);

    expect(series).toEqual({
      name: "Dark Souls",
      members: [
        { igdbGameId: 1, name: "Dark Souls", releaseDate: new Date(1_316_649_600_000).toISOString(), steamAppId: undefined },
        { igdbGameId: 2, name: "Dark Souls II", releaseDate: new Date(1_394_496_000_000).toISOString(), steamAppId: 236430 },
        { igdbGameId: 3, name: "Dark Souls IV", releaseDate: undefined, steamAppId: undefined },
      ],
    });
    expect(igdbQuery).toHaveBeenCalledWith("games", "fields id,name,first_release_date; where id = (1,2,3) & version_parent = null; limit 100;");
  });

  it("falls back on the franchise when the game belongs to no series", async () => {
    answer((endpoint, query) => {
      if (endpoint === "games" && query.includes("fields collections,franchises")) return [{ id: 2, franchises: [7] }];
      if (endpoint === "franchises") return [{ id: 7, name: "Souls", games: [2, 5] }];
      if (endpoint === "games") return [{ id: 2, name: "Dark Souls II" }, { id: 5, name: "Demon's Souls" }];
      return [];
    });

    expect((await lookupGameSeries(2))?.name).toBe("Souls");
  });

  it("finds no series for a game alone in it, or in none", async () => {
    answer((endpoint, query) => {
      if (endpoint === "games" && query.includes("fields collections,franchises")) return [{ id: 2, collections: [40] }];
      if (endpoint === "collections") return [{ id: 40, name: "Solo", games: [2] }];
      return [];
    });
    expect(await lookupGameSeries(2)).toBeNull();

    answer(() => []);
    expect(await lookupGameSeries(2)).toBeNull();
  });
});
