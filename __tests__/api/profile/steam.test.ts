// __tests__/api/profile/steam.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/profile/steam/route";
import { profileSyncRequest } from "../../helpers/profileRequests";
import { initDatabase, setDbForTesting } from "@/lib/db";
import { textResponse } from "../../helpers/responses";
import type { OwnedGame } from "@/lib/types";

describe("POST /api/profile/steam Public Scraper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("returns 400 when user param is missing", async () => {
    const res = await POST(profileSyncRequest("steam"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("requis");
  });

  it("parses steam profile XML, HTML showcases, stats, and filters seasonal badges", async () => {
    const mockXml = `
      <profile>
        <steamID64>76561198000000000</steamID64>
        <steamID><![CDATA[TestGamer [FR]]]></steamID>
        <avatarFull><![CDATA[https://avatars.example.com/testgamer.jpg]]></avatarFull>
      </profile>
    `;

    const mockHtml = `
      <div class="actual_persona_name">TestGamer [FR]</div>
      <div class="friendPlayerLevelNum">32</div>
      <span class="count_link_label">Jeux</span>
      <span class="profile_count_link_total">219</span>
      <div class="value">768</div>
      <div class="label">Succès</div>
      <div class="showcase_achievement" data-tooltip-html="Hollow Knight<br>Purification<br>0,9 % des joueurs">
        <a href="https://steamcommunity.com/profiles/76561198000000000/achievements/367520">
          <img src="https://cdn.example.com/hk_icon.jpg">
        </a>
      </div>
    `;

    const mockBadgesHtml = `
      <div class="badge_row ">
        <a href="https://steamcommunity.com/profiles/76561198000000000/gamecards/412020/"></a>
        <div class="badge_title">Metro Exodus</div>
      </div>
      <div class="badge_row ">
        <a href="https://steamcommunity.com/profiles/76561198000000000/gamecards/2861720/"></a>
        <div class="badge_title">Soldes d'hiver 2024</div>
      </div>
    `;

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(textResponse(mockXml))
      .mockResolvedValueOnce(textResponse(mockHtml))
      .mockResolvedValueOnce(textResponse(mockBadgesHtml))
      .mockResolvedValueOnce(textResponse(""));

    const res = await POST(profileSyncRequest("steam", { user: "76561198000000000" }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.displayName).toBe("TestGamer [FR]");
    expect(data.account.level).toBe(32);

    const appIds = data.discoveredGames.map((g: OwnedGame) => g.appId);
    expect(appIds).toContain(367520);
    expect(appIds).toContain(412020);
    expect(appIds).not.toContain(2861720);
  });

  it("handles profile not found error", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(textResponse("<profile><error>The specified profile could not be found.</error></profile>"))
      .mockResolvedValueOnce(textResponse("<html><body>The specified profile could not be found.</body></html>"))
      .mockResolvedValueOnce(textResponse("", 404))
      .mockResolvedValueOnce(textResponse("", 404));

    const res = await POST(profileSyncRequest("steam", { user: "unknown_user_123" }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("introuvable");
  });
});
