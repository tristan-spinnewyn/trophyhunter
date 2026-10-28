// __tests__/lib/library/bulk-import.test.ts
import { describe, it, expect } from "vitest";
import { parseBulkImportText } from "@/lib/library/bulk-import";

describe("parseBulkImportText", () => {
  it("reads app ids and names from Steam's escaped games list JSON", () => {
    const games = parseBulkImportText('[{&quot;appid&quot;:620,&quot;name&quot;:&quot;Portal 2&quot;},{"appid": 400, "name": "Portal \u00e9"}]');

    expect(games.map((g) => [g.appId, g.name])).toEqual([[620, "Portal 2"], [400, "Portal é"]]);
    expect(games[0]).toMatchObject({
      platform: "steam", source: "steam-import", totalAchievements: 0,
      headerImg: "https://cdn.akamai.steamstatic.com/steam/apps/620/header.jpg",
    });
  });

  it("falls back to unique app ids found in URLs or lists", () => {
    const games = parseBulkImportText("https://store.steampowered.com/app/620/Portal_2/ 400, 620 and 12");

    expect(games.map((g) => g.appId)).toEqual([620, 400]);
    expect(games[0].name).toBe("Jeu Steam #620");
  });

  it("caps the fallback at 60 games", () => {
    const ids = Array.from({ length: 80 }, (_, i) => 1000 + i).join(" ");
    expect(parseBulkImportText(ids)).toHaveLength(60);
  });
});
