// __tests__/lib/gog/identifier.services.test.ts
import { describe, it, expect } from "vitest";
import {
  parseGogUsername,
  normalizeGogImageUrl,
} from "@/lib/gog/identifier.services";
import { GogSyncError } from "@/lib/gog/gog.types";

describe("GOG identifier service", () => {
  it("extracts username from full GOG profile URL", () => {
    expect(parseGogUsername("https://www.gog.com/u/shinkuma13")).toBe(
      "shinkuma13"
    );
    expect(
      parseGogUsername("https://www.gog.com/en/u/shinkuma13/games?sort=recent")
    ).toBe("shinkuma13");
  });

  it("returns clean username when given plain handle", () => {
    expect(parseGogUsername("  shinkuma13  ")).toBe("shinkuma13");
    expect(parseGogUsername("@shinkuma13")).toBe("shinkuma13");
  });

  it("throws GogSyncError on empty or invalid URL input", () => {
    expect(() => parseGogUsername("   ")).toThrowError(GogSyncError);
    expect(() => parseGogUsername("https://example.com/other")).toThrowError(
      GogSyncError
    );
  });

  it("normalizes escaped and protocol-relative image URLs", () => {
    expect(normalizeGogImageUrl("//images.gog.com/av.jpg")).toBe(
      "https://images.gog.com/av.jpg"
    );
    expect(normalizeGogImageUrl("https:\\/\\/images.gog.com\\/av.jpg")).toBe(
      "https://images.gog.com/av.jpg"
    );
    expect(normalizeGogImageUrl(undefined)).toBe("");
  });
});
