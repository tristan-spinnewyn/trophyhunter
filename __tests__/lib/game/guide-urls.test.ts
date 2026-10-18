// __tests__/lib/game/guide-urls.test.ts
import { describe, it, expect } from "vitest";
import { buildGuideUrls } from "@/components/achievement/achievementRarity";

describe("buildGuideUrls", () => {
  it("builds consistent guide URLs across platforms", () => {
    const urls = buildGuideUrls("Battlefield V", "Touche-à-tout", 123456);

    expect(urls.psthcUrl).toBe("https://www.google.com/search?q=site%3Apsthc.fr%20Battlefield%20V%20guide");
    expect(urls.steamGuidesUrl).toBe("https://steamcommunity.com/app/123456/guides/?requiredtags[]=Achievements");
    expect(urls.youtubeUrl).toContain("Battlefield%20V");
    expect(urls.youtubeUrl).toContain("Touche-%C3%A0-tout");
  });

  it("handles titles with special editions in psthc url", () => {
    const urls = buildGuideUrls("Persona 5 - Standard Edition", "Phantom Thief", 999);

    expect(urls.psthcUrl).toBe("https://www.google.com/search?q=site%3Apsthc.fr%20Persona%205%20guide");
  });
});
