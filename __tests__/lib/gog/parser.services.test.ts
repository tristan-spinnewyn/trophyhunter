// __tests__/lib/gog/parser.services.test.ts
import { describe, it, expect } from "vitest";
import {
  parseGogProfileHtml,
  parseGogGameAchievementsHtml,
} from "@/lib/gog/parser.services";

describe("GOG parser service", () => {
  it("parses window.profilesData.profileUser from modern GOG HTML", () => {
    const html = `
      <script>
        window.profilesData = window.profilesData || {};
        window.profilesData.profileUser = {"username":"shinkuma13","created_date":"2017-12-20T12:24:34+00:00","userId":"50793782277245151","avatar":"https:\\/\\/images.gog.com\\/av.jpg","avatars":{"large_2x":"https:\\/\\/images.gog.com\\/av_l2x.jpg"},"stats":{"games_owned":"33","achievements":15,"hours_played":8}};
      </script>
    `;
    const parsed = parseGogProfileHtml(html, "shinkuma13");
    expect(parsed.userId).toBe("50793782277245151");
    expect(parsed.username).toBe("shinkuma13");
    expect(parsed.avatarUrl).toBe("https://images.gog.com/av_l2x.jpg");
    expect(parsed.gamesOwned).toBe(33);
    expect(parsed.totalAchievements).toBe(15);
    expect(parsed.hoursPlayed).toBe(8);
  });

  it("falls back to legacy HTML classes when profilesData is absent", () => {
    const html = `
      <img class="user-avatar" src="//images.gog.com/legacy.jpg" />
      <div class="user-stats__item-count">42</div>
    `;
    const parsed = parseGogProfileHtml(html, "LegacyUser");
    expect(parsed.username).toBe("LegacyUser");
    expect(parsed.avatarUrl).toBe("https://images.gog.com/legacy.jpg");
    expect(parsed.gamesOwned).toBe(42);
  });

  it("parses game achievements and unlocked IDs from GOG game page", () => {
    const html = `
      <script>
        window.profilesData.profileUser = {"userId":"50793782277245151"};
        window.profilesData.achievements = [{"achievement":{"id":"ach_1","name":"Spartan 2033","description":"Complete in Spartan Mode.","imageUrlUnlocked":"https:\\/\\/images.gog.com\\/u1.jpg","rarity":10.1,"visible":true},"stats":{"50793782277245151":{"isUnlocked":true,"unlockDate":1616974512}}},{"achievement":{"id":"ach_2","name":"Hidden One","description":"Secret","imageUrlLocked":"https:\\/\\/images.gog.com\\/l2.jpg","rarity":1.5,"visible":false},"stats":[]}];
      </script>
    `;
    const result = parseGogGameAchievementsHtml(html);
    expect(result.totalAchievements).toBe(2);
    expect(result.unlockedCount).toBe(1);
    expect(result.unlockedIds).toEqual(["ach_1"]);
    expect(result.achievements[1]?.hidden).toBe(true);
  });
});
