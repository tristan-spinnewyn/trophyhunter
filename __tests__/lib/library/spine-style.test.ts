import { describe, it, expect } from "vitest";
import { SPINE_PALETTE, getSpineStyle, relativeLuminance } from "@/lib/library/spine-style";

const game = (appId: number, name = `Game ${appId}`) => ({ appId, name, platform: "steam" as const });

describe("getSpineStyle", () => {
  it("gives the same game the same spine every time", () => {
    expect(getSpineStyle(game(367520, "Hollow Knight"))).toEqual(getSpineStyle(game(367520, "Hollow Knight")));
  });

  it("picks its colour from the shelf palette", () => {
    const colours = SPINE_PALETTE.map((c) => c.background);
    for (let id = 1; id < 40; id++) {
      expect(colours).toContain(getSpineStyle(game(id)).background);
    }
  });

  it("varies colours across a collection", () => {
    const colours = new Set(Array.from({ length: 40 }, (_, i) => getSpineStyle(game(i + 1)).background));
    expect(colours.size).toBeGreaterThan(6);
  });

  it("keeps spine sizes within a believable box range", () => {
    for (let id = 1; id < 60; id++) {
      const { widthPx, heightPx } = getSpineStyle(game(id));
      expect(widthPx).toBeGreaterThanOrEqual(42);
      expect(widthPx).toBeLessThanOrEqual(60);
      expect(heightPx).toBeGreaterThanOrEqual(226);
      expect(heightPx).toBeLessThanOrEqual(270);
    }
  });

  it("tells the same game apart on two platforms", () => {
    const onSteam = getSpineStyle({ appId: 7, name: "Same", platform: "steam" });
    const onGog = getSpineStyle({ appId: 7, name: "Same", platform: "gog" });
    expect([onSteam.background, onSteam.heightPx]).not.toEqual([onGog.background, onGog.heightPx]);
  });
});

describe("SPINE_PALETTE", () => {
  it("pairs every background with a readable title colour", () => {
    for (const { background, foreground } of SPINE_PALETTE) {
      const [hi, lo] = [relativeLuminance(background), relativeLuminance(foreground)].sort((a, b) => b - a);
      expect((hi + 0.05) / (lo + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("relativeLuminance", () => {
  it("follows the WCAG definition at both ends", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
  });
});
