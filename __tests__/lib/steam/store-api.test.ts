// __tests__/lib/steam/store-api.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  fetchSteamAchievementsByAppId,
  searchSteamStoreFallback,
  fetchOwnedGamesFromSteamApi,
  resolveMissingGameNamesViaStore,
} from "@/lib/steam/store-api";
import type { DiscoveredGameData } from "@/lib/steam/types";
import { requestUrl } from "../../helpers/networkGuard";
import { jsonResponse, textResponse } from "../../helpers/responses";

type Route = [prefix: string, respond: () => Response | Promise<Response>];

function routeFetch(routes: readonly Route[]) {
  return vi.spyOn(global, "fetch").mockImplementation(async (input) => {
    const url = requestUrl(input);
    const route = routes.find(([prefix]) => url.startsWith(prefix));
    if (!route) {
      throw new Error(`Unexpected request: ${url}`);
    }
    return route[1]();
  });
}

const ACHIEVEMENTS_URL = "https://api.steampowered.com/IPlayerService/GetGameAchievements/";
const STORE_SEARCH_URL = "https://store.steampowered.com/api/storesearch/";
const APP_DETAILS_URL = "https://store.steampowered.com/api/appdetails";
const OWNED_GAMES_URL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/";

describe("lib/steam/store-api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchSteamAchievementsByAppId", () => {
    it("returns the achievement schema when the API answers with a JSON list", async () => {
      routeFetch([[ACHIEVEMENTS_URL, () => jsonResponse({ response: { achievements: [{ internal_name: "A1" }] } })]]);

      await expect(fetchSteamAchievementsByAppId("570")).resolves.toEqual({
        type: "schema",
        list: [{ internal_name: "A1" }],
      });
    });

    it("falls back to the raw body when it is not an achievement list", async () => {
      routeFetch([[ACHIEVEMENTS_URL, () => textResponse("<html>stats</html>")]]);

      await expect(fetchSteamAchievementsByAppId("570")).resolves.toEqual({
        type: "html",
        html: "<html>stats</html>",
      });
    });

    it("returns null on an HTTP error or a network failure", async () => {
      routeFetch([[ACHIEVEMENTS_URL, () => jsonResponse({}, 500)]]);
      await expect(fetchSteamAchievementsByAppId("570")).resolves.toBeNull();

      vi.restoreAllMocks();
      routeFetch([[ACHIEVEMENTS_URL, () => Promise.reject(new Error("offline"))]]);
      await expect(fetchSteamAchievementsByAppId("570")).resolves.toBeNull();
    });
  });

  describe("searchSteamStoreFallback", () => {
    const searchHit = () => jsonResponse({ items: [{ id: 292030, name: "The Witcher 3", tiny_image: "w3.jpg" }] });
    const schema = () => jsonResponse({ response: { achievements: [{ internal_name: "A1" }] } });

    it("returns the match, store details and achievements in full mode", async () => {
      const fetchSpy = routeFetch([
        [STORE_SEARCH_URL, searchHit],
        [APP_DETAILS_URL, () => jsonResponse({ "292030": { data: { name: "The Witcher 3" } } })],
        [ACHIEVEMENTS_URL, schema],
      ]);

      const result = await searchSteamStoreFallback("The Witcher® 3: Wild Hunt - Game of the Year Edition");

      expect(result).toEqual({
        matchedAppId: "292030",
        matchedImage: "w3.jpg",
        gameInfo: { name: "The Witcher 3" },
        achResult: { type: "schema", list: [{ internal_name: "A1" }] },
      });
      expect(requestUrl(fetchSpy.mock.calls[0][0])).toContain("term=The%20Witcher%203%3A%20Wild%20Hunt");
    });

    it("skips the store details request in fast mode", async () => {
      const fetchSpy = routeFetch([
        [STORE_SEARCH_URL, searchHit],
        [ACHIEVEMENTS_URL, () => jsonResponse({}, 404)],
      ]);

      const result = await searchSteamStoreFallback("The Witcher 3", true);

      expect(result).toEqual({ matchedAppId: "292030", matchedImage: "w3.jpg", achResult: undefined });
      expect(fetchSpy.mock.calls.map(([input]) => requestUrl(input)).some((url) => url.startsWith(APP_DETAILS_URL))).toBe(false);
    });

    it("tolerates a failing store details request", async () => {
      routeFetch([
        [STORE_SEARCH_URL, searchHit],
        [APP_DETAILS_URL, () => Promise.reject(new Error("offline"))],
        [ACHIEVEMENTS_URL, schema],
      ]);

      const result = await searchSteamStoreFallback("The Witcher 3");

      expect(result.matchedAppId).toBe("292030");
      expect(result.gameInfo).toBeUndefined();
    });

    it("returns an empty result when the search fails or finds nothing", async () => {
      routeFetch([[STORE_SEARCH_URL, () => jsonResponse({}, 503)]]);
      await expect(searchSteamStoreFallback("Unknown")).resolves.toEqual({});

      vi.restoreAllMocks();
      routeFetch([[STORE_SEARCH_URL, () => jsonResponse({ items: [] })]]);
      await expect(searchSteamStoreFallback("Unknown")).resolves.toEqual({});

      vi.restoreAllMocks();
      routeFetch([[STORE_SEARCH_URL, () => Promise.reject(new Error("offline"))]]);
      await expect(searchSteamStoreFallback("Unknown")).resolves.toEqual({});
    });
  });

  describe("fetchOwnedGamesFromSteamApi", () => {
    it("does not call the API without an API key or SteamID", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");
      const upsert = vi.fn();

      await expect(fetchOwnedGamesFromSteamApi("", "7656", upsert)).resolves.toBe(0);
      await expect(fetchOwnedGamesFromSteamApi("key", "", upsert)).resolves.toBe(0);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("upserts each owned game with its playtime in hours and its real last session, and returns the game count", async () => {
      routeFetch([
        [
          OWNED_GAMES_URL,
          () =>
            jsonResponse({
              response: {
                game_count: 3,
                games: [
                  { appid: 570, name: "Dota 2", playtime_forever: 125, rtime_last_played: 1760000000 },
                  { appid: 440, name: "TF2", rtime_last_played: 0 },
                  { name: "No app id" },
                ],
              },
            }),
        ],
      ]);
      const upsert = vi.fn();

      await expect(fetchOwnedGamesFromSteamApi("key", "7656", upsert)).resolves.toBe(3);
      expect(upsert.mock.calls).toEqual([
        [570, { name: "Dota 2", playtimeHours: 2.1, lastPlayed: "2025-10-09T08:53:20.000Z" }],
        [440, { name: "TF2", playtimeHours: 0, lastPlayed: undefined }],
      ]);
    });

    it("falls back to the list length when game_count is missing", async () => {
      routeFetch([[OWNED_GAMES_URL, () => jsonResponse({ response: { games: [{ appid: 570, name: "Dota 2" }] } })]]);

      await expect(fetchOwnedGamesFromSteamApi("key", "7656", vi.fn())).resolves.toBe(1);
    });

    it("returns 0 on an HTTP error, an empty profile or a network failure", async () => {
      routeFetch([[OWNED_GAMES_URL, () => jsonResponse({}, 403)]]);
      await expect(fetchOwnedGamesFromSteamApi("key", "7656", vi.fn())).resolves.toBe(0);

      vi.restoreAllMocks();
      routeFetch([[OWNED_GAMES_URL, () => jsonResponse({ response: {} })]]);
      await expect(fetchOwnedGamesFromSteamApi("key", "7656", vi.fn())).resolves.toBe(0);

      vi.restoreAllMocks();
      routeFetch([[OWNED_GAMES_URL, () => Promise.reject(new Error("offline"))]]);
      await expect(fetchOwnedGamesFromSteamApi("key", "7656", vi.fn())).resolves.toBe(0);
    });
  });

  describe("resolveMissingGameNamesViaStore", () => {
    it("does nothing when every game already has a name", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");

      await resolveMissingGameNamesViaStore([{ appId: 570, name: "Dota 2", totalAchievements: 0, unlockedCount: 0 }]);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("fills names and missing achievement totals from the store, ignoring failed lookups", async () => {
      routeFetch([
        [`${APP_DETAILS_URL}?appids=10&`, () => jsonResponse({ "10": { data: { name: "Counter-Strike", achievements: { total: 5 } } } })],
        [`${APP_DETAILS_URL}?appids=20&`, () => jsonResponse({ "20": { data: { name: "Half-Life", achievements: { total: 9 } } } })],
        [`${APP_DETAILS_URL}?appids=30&`, () => jsonResponse({}, 500)],
        [`${APP_DETAILS_URL}?appids=40&`, () => Promise.reject(new Error("offline"))],
      ]);
      const entries: DiscoveredGameData[] = [
        { appId: 10, totalAchievements: 0, unlockedCount: 0 },
        { appId: 20, totalAchievements: 3, unlockedCount: 1 },
        { appId: 30, totalAchievements: 0, unlockedCount: 0 },
        { appId: 40, totalAchievements: 0, unlockedCount: 0 },
      ];

      await resolveMissingGameNamesViaStore(entries);

      expect(entries).toEqual([
        { appId: 10, name: "Counter-Strike", totalAchievements: 5, unlockedCount: 0 },
        { appId: 20, name: "Half-Life", totalAchievements: 3, unlockedCount: 1 },
        { appId: 30, totalAchievements: 0, unlockedCount: 0 },
        { appId: 40, totalAchievements: 0, unlockedCount: 0 },
      ]);
    });
  });
});
