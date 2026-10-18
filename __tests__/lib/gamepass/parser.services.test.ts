// __tests__/lib/gamepass/parser.services.test.ts

import { describe, it, expect } from "vitest";
import {
  extractSiglProductIds,
  normalizeMsImageUri,
  resolveMsStoreImage,
  resolveNumericAppId,
  parseDisplayCatalogProduct,
  parseDisplayCatalogProducts,
} from "@/lib/gamepass/parser.services";

describe("lib/gamepass/parser.services", () => {
  it("extractSiglProductIds extracts unique non-empty product IDs and ignores metadata header", () => {
    expect(extractSiglProductIds(null)).toEqual([]);
    expect(extractSiglProductIds({})).toEqual([]);
    const raw = [
      { siglId: "fdd9e2a7", title: "Tous les jeux PC" },
      { id: " 9NPDN9R45JX4 " },
      { id: "9NPDN9R45JX4" },
      { id: "" },
      { id: "9P8LR42PTRGJ" },
    ];
    expect(extractSiglProductIds(raw)).toEqual(["9NPDN9R45JX4", "9P8LR42PTRGJ"]);
  });

  it("normalizeMsImageUri and resolveMsStoreImage prioritize hero art and normalize protocols", () => {
    expect(normalizeMsImageUri(undefined)).toBe("");
    expect(normalizeMsImageUri("  ")).toBe("");
    expect(normalizeMsImageUri("//store-images.s-microsoft.com/img.png")).toBe(
      "https://store-images.s-microsoft.com/img.png"
    );
    expect(normalizeMsImageUri("http://example.com/a.jpg")).toBe("https://example.com/a.jpg");

    expect(resolveMsStoreImage([])).toBe("");
    const images = [
      { ImagePurpose: "Screenshot", Uri: "//store-images.s-microsoft.com/screen.png" },
      { ImagePurpose: "TitledHeroArt", Uri: "//store-images.s-microsoft.com/hero.png" },
    ];
    expect(resolveMsStoreImage(images)).toBe("https://store-images.s-microsoft.com/hero.png");
    expect(resolveMsStoreImage([{ ImagePurpose: "Custom", Uri: "https://cdn.ms/custom.png" }])).toBe(
      "https://cdn.ms/custom.png"
    );
  });

  it("resolveNumericAppId uses XboxTitleId when available and falls back to hash", () => {
    expect(
      resolveNumericAppId("9NPDN9R45JX4", [{ IdType: "XboxTitleId", Value: "1615431074" }])
    ).toBe(1615431074);
    const hashed = resolveNumericAppId("9NPDN9R45JX4", [{ IdType: "Other", Value: "abc" }]);
    expect(hashed).toBeGreaterThan(0);
  });

  it("parseDisplayCatalogProduct and parseDisplayCatalogProducts handle valid and invalid products", () => {
    expect(parseDisplayCatalogProduct({})).toBeNull();
    expect(parseDisplayCatalogProducts(null)).toEqual([]);
    expect(parseDisplayCatalogProducts({ Products: "invalid" })).toEqual([]);

    const payload = {
      Products: [
        { ProductId: "MISSING_TITLE" },
        {
          ProductId: "9NPDN9R45JX4",
          LocalizedProperties: [
            {
              ProductTitle: "1000xRESIST",
              ShortDescription: "Sci-fi adventure",
              DeveloperName: "sunset visitor",
              PublisherName: "Fellow Traveller",
              Images: [{ ImagePurpose: "Poster", Uri: "//store-images.s-microsoft.com/p.png" }],
            },
          ],
          Properties: {
            Category: "Action & adventure",
            Attributes: [{ Name: "XblAchievements" }, { Name: "XPA" }],
          },
          AlternateIds: [{ IdType: "XboxTitleId", Value: "1615431074" }],
          MarketProperties: [{ OriginalReleaseDate: "2025-11-04T00:00:00Z" }],
        },
      ],
    };

    const parsed = parseDisplayCatalogProducts(payload);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({
      storeId: "9NPDN9R45JX4",
      appId: 1615431074,
      name: "1000xRESIST",
      headerImg: "https://store-images.s-microsoft.com/p.png",
      developer: "sunset visitor",
      publisher: "Fellow Traveller",
      category: "Action & adventure",
      shortDescription: "Sci-fi adventure",
      hasXboxAchievements: true,
      isPlayAnywhere: true,
      releaseDate: "2025-11-04T00:00:00Z",
    });
  });
});
