// __tests__/lib/gamepass/catalog-filter.services.test.ts

import { describe, it, expect } from "vitest";
import {
  normalizeGameTitle,
  isGameInLibrary,
  extractGamePassCategories,
  filterGamePassCatalog,
} from "@/lib/gamepass/catalog-filter.services";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";
import type { OwnedGame } from "@/lib/types";

const CATALOG_SAMPLE: readonly GamePassCatalogItem[] = [
  {
    storeId: "9A",
    appId: 101,
    name: "Clair Obscur: Expedition 33",
    headerImg: "",
    developer: "Sandfall Interactive",
    publisher: "Kepler",
    category: "Jeu de rôle",
    shortDescription: "RPG au tour par tour",
    hasXboxAchievements: true,
    isPlayAnywhere: true,
  },
  {
    storeId: "9B",
    appId: 202,
    name: "DOOM: The Dark Ages",
    headerImg: "",
    developer: "id Software",
    publisher: "Bethesda",
    category: "Action & aventure",
    shortDescription: "FPS brutal",
    hasXboxAchievements: true,
    isPlayAnywhere: false,
  },
  {
    storeId: "9C",
    appId: 303,
    name: "Solitaire Collection",
    headerImg: "",
    developer: "Microsoft Casual",
    publisher: "Xbox Game Studios",
    category: "Cartes & plateau",
    shortDescription: "Cartes classiques",
    hasXboxAchievements: false,
    isPlayAnywhere: false,
  },
];

const OWNED_SAMPLE: readonly OwnedGame[] = [
  {
    appId: 9999,
    name: "Clair Obscur - Éxpédition 33",
    headerImg: "",
    platform: "steam",
    totalAchievements: 50,
    unlockedCount: 10,
    addedAt: "2026-01-01",
  },
];

describe("components/dashboard/gamepass/gamepassFilter.services", () => {
  it("normalizes game titles and detects owned games by appId or normalized title", () => {
    expect(normalizeGameTitle("Clair Obscur: Éxpédition 33!")).toBe("clairobscurexpedition33");
    expect(isGameInLibrary(CATALOG_SAMPLE[0], OWNED_SAMPLE)).toBe(true);
    expect(isGameInLibrary(CATALOG_SAMPLE[1], OWNED_SAMPLE)).toBe(false);
  });

  it("extracts sorted unique categories", () => {
    expect(extractGamePassCategories(CATALOG_SAMPLE)).toEqual([
      "Action & aventure",
      "Cartes & plateau",
      "Jeu de rôle",
    ]);
  });

  it("filters catalog by category, featureFilter and searchQuery", () => {
    expect(
      filterGamePassCatalog({
        catalog: CATALOG_SAMPLE,
        ownedGames: OWNED_SAMPLE,
        searchQuery: "",
        categoryFilter: "Jeu de rôle",
        featureFilter: "all",
      }).map((g) => g.storeId)
    ).toEqual(["9A"]);

    expect(
      filterGamePassCatalog({
        catalog: CATALOG_SAMPLE,
        ownedGames: OWNED_SAMPLE,
        searchQuery: "",
        categoryFilter: "all",
        featureFilter: "play-anywhere",
      }).map((g) => g.storeId)
    ).toEqual(["9A"]);

    expect(
      filterGamePassCatalog({
        catalog: CATALOG_SAMPLE,
        ownedGames: OWNED_SAMPLE,
        searchQuery: "bethesda",
        categoryFilter: "all",
        featureFilter: "unowned",
      }).map((g) => g.storeId)
    ).toEqual(["9B"]);
  });
});
