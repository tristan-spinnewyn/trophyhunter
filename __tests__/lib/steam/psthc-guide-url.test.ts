// __tests__/lib/steam/psthc-guide-url.test.ts
import { describe, it, expect } from "vitest";
import { buildPsthcGuideUrl } from "@/lib/steam/game-metadata";

describe("buildPsthcGuideUrl", () => {
  it("builds a search query targeting psthc site with guide keyword", () => {
    const url = buildPsthcGuideUrl("Battlefield V");
    expect(url).toBe("https://www.google.com/search?q=site%3Apsthc.fr%20Battlefield%20V%20guide");
  });

  it("cleans edition and trademark symbols from game title", () => {
    const url = buildPsthcGuideUrl("The Witcher® 3: Wild Hunt - Game of the Year Edition");
    expect(url).toBe("https://www.google.com/search?q=site%3Apsthc.fr%20The%20Witcher%203%3A%20Wild%20Hunt%20guide");
  });

  it("handles titles with special characters and parenthesis", () => {
    const url = buildPsthcGuideUrl("Marvel's Spider-Man (PS4)");
    expect(url).toBe("https://www.google.com/search?q=site%3Apsthc.fr%20Marvel's%20Spider-Man%20guide");
  });

  it("handles empty title fallback gracefully", () => {
    const url = buildPsthcGuideUrl("");
    expect(url).toBe("https://www.google.com/search?q=site%3Apsthc.fr%20%20guide");
  });
});
