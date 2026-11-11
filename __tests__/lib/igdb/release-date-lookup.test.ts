// __tests__/lib/igdb/release-date-lookup.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { igdbQuery } = vi.hoisted(() => ({ igdbQuery: vi.fn() }));
vi.mock("@/lib/igdb/igdb-client", () => ({ igdbQuery }));

import { lookupReleaseDates } from "@/lib/igdb/release-date-lookup";

const noPause = async () => {};

describe("lookupReleaseDates", () => {
  beforeEach(() => igdbQuery.mockReset());

  it("reads the first release date of each game IGDB knows", async () => {
    igdbQuery.mockImplementation(async (endpoint: string, query: string) => {
      if (endpoint === "external_games") return [{ game: 10, uid: "99" }];
      if (endpoint === "games" && query.startsWith("search")) return [{ id: 20, name: "Hollow Knight Silksong" }];
      if (endpoint === "games") return [{ id: 10, first_release_date: 1_820_000_000 }, { id: 20 }];
      return [];
    });

    const dates = await lookupReleaseDates(
      [
        { appId: 99, platform: "steam", name: "Hades II" },
        { appId: 5, platform: "xbox", name: "Hollow Knight Silksong" },
        { appId: 6, platform: "epic", name: "Unknown" },
      ],
      { pause: noPause }
    );

    expect(dates).toEqual(
      new Map([
        ["steam_99", { igdbGameId: 10, releaseDate: new Date(1_820_000_000 * 1000).toISOString() }],
        ["xbox_5", { igdbGameId: 20, releaseDate: null }],
        ["epic_6", null],
      ])
    );
    expect(igdbQuery).toHaveBeenCalledWith("games", "fields id,first_release_date; where id = (10,20); limit 500;");
  });

  it("asks nothing for an empty list", async () => {
    expect(await lookupReleaseDates([], { pause: noPause })).toEqual(new Map());
    expect(igdbQuery).not.toHaveBeenCalled();
  });
});
