// __tests__/lib/steam/profile-scraper.test.ts
import { describe, it, expect, vi } from "vitest";
import {
  extractGamesFromBadges,
  extractGamesFromProfileHtml,
  extractGamesFromReviews,
  extractGamesFromXml,
  parseSteamIdentifier,
} from "@/lib/steam/profile-scraper";
import { decodeHtmlEntities, parseXmlTag, stripHtmlTags } from "@/lib/steam/html";

describe("parseSteamIdentifier", () => {
  it.each([
    ["gabelogannewell", { userIdentifier: "gabelogannewell", isVanity: true }],
    ["76561197960287930", { userIdentifier: "76561197960287930", isVanity: false }],
    ["https://steamcommunity.com/id/gaben/", { userIdentifier: "gaben", isVanity: true }],
    ["https://steamcommunity.com/profiles/76561197960287930", { userIdentifier: "76561197960287930", isVanity: false }],
  ])("reads %s", (raw, expected) => {
    expect(parseSteamIdentifier(raw)).toMatchObject(expected);
  });
});

describe("extractGamesFromProfileHtml", () => {
  it("reads recent games, completionist and collector showcases", () => {
    const html = `
      <div class="recent_game"><a href="https://steamcommunity.com/app/620">x</a>
        <div class="game_name"><a href="#">Portal 2 &amp; Co</a></div>
        <div class="game_info_details">12,5 h en tout</div>
        <div class="game_info_achievement_summary"><span>30 succès sur 51</span></div>
      </div>
      <div class="showcase_achievementscompletionist_game "><a href="https://steamcommunity.com/stats/achievements/400"></a><span class="num_achievements">15</span></div>
      <div class="showcase_gamecollector_game"><a href="https://steamcommunity.com/app/70"></a></div>`;
    const upsert = vi.fn();

    extractGamesFromProfileHtml(html, upsert);

    expect(upsert).toHaveBeenCalledWith(620, {
      name: "Portal 2 & Co", playtimeHours: 12.5, unlockedCount: 30, totalAchievements: 51,
    });
    expect(upsert).toHaveBeenCalledWith(400, { totalAchievements: 15, unlockedCount: 15 });
    expect(upsert).toHaveBeenCalledWith(70, {});
  });
});

describe("extractGamesFromBadges", () => {
  it("counts badges and skips seasonal event badges", () => {
    const badges = `
      <div class="badge_row "><a href="https://steamcommunity.com/gamecards/620/"></a><div class="badge_title">Portal 2</div></div>
      <div class="badge_row "><a href="https://steamcommunity.com/gamecards/2861690/"></a><div class="badge_title">Soldes d'hiver 2025</div></div>`;
    const upsert = vi.fn();

    expect(extractGamesFromBadges(badges, upsert)).toBe(2);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(620, { name: "Portal 2" });
  });

  it("returns 0 for an empty page", () => {
    expect(extractGamesFromBadges("", vi.fn())).toBe(0);
  });
});

describe("extractGamesFromReviews and extractGamesFromXml", () => {
  it("registers every reviewed app", () => {
    const upsert = vi.fn();
    extractGamesFromReviews('<a href="https://steamcommunity.com/app/10"></a><a href="https://steamcommunity.com/app/20"></a>', upsert);
    expect(upsert.mock.calls.map((c) => c[0])).toEqual([10, 20]);
  });

  it("reads most played games from the profile XML, whose hours use comma thousands separators", () => {
    const upsert = vi.fn();
    extractGamesFromXml(
      "<mostPlayedGame><gameName><![CDATA[Dota 2]]></gameName><gameLink>https://steamcommunity.com/app/570</gameLink><hoursOnRecord>1,234.5</hoursOnRecord></mostPlayedGame>",
      upsert
    );
    expect(upsert).toHaveBeenCalledWith(570, { name: "Dota 2", playtimeHours: 1234.5 });
  });
});

describe("html helpers", () => {
  it("decodes entities, strips nested tags and reads CDATA or plain XML tags", () => {
    expect(decodeHtmlEntities("Tom &amp; Jerry&nbsp;&quot;Hi&quot; &#39;x&#39; &lt;3&gt;")).toBe(`Tom & Jerry "Hi" 'x' <3>`);
    expect(stripHtmlTags("<b><i>Bold</i></b> text")).toBe("Bold text");
    expect(parseXmlTag("<steamID><![CDATA[Gabe]]></steamID>", "steamID")).toBe("Gabe");
    expect(parseXmlTag("<level>42</level>", "level")).toBe("42");
    expect(parseXmlTag("<other/>", "level")).toBe("");
  });
});
