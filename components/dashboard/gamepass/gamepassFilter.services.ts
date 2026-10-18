// components/dashboard/gamepass/gamepassFilter.services.ts

import type { OwnedGame } from "@/lib/types";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";
import type { GamePassFilterParams } from "./GamePassPanel.types";

export function normalizeGameTitle(rawTitle: string): string {
  return rawTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function isGameInLibrary(
  item: GamePassCatalogItem,
  ownedGames: readonly OwnedGame[]
): boolean {
  const normalizedTarget = normalizeGameTitle(item.name);
  return ownedGames.some(
    (g) =>
      g.appId === item.appId ||
      (normalizedTarget.length > 0 && normalizeGameTitle(g.name) === normalizedTarget)
  );
}

export function extractGamePassCategories(
  catalog: readonly GamePassCatalogItem[]
): string[] {
  const categories = new Set<string>();
  for (const item of catalog) {
    const cat = item.category?.trim();
    if (cat) categories.add(cat);
  }
  return Array.from(categories).sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" })
  );
}

export function filterGamePassCatalog(
  params: GamePassFilterParams
): GamePassCatalogItem[] {
  const { catalog, ownedGames, searchQuery, categoryFilter, featureFilter } = params;
  const query = searchQuery.trim().toLowerCase();

  return catalog.filter((item) => {
    if (categoryFilter !== "all" && item.category !== categoryFilter) {
      return false;
    }

    const owned = isGameInLibrary(item, ownedGames);
    if (featureFilter === "achievements" && !item.hasXboxAchievements) return false;
    if (featureFilter === "play-anywhere" && !item.isPlayAnywhere) return false;
    if (featureFilter === "owned" && !owned) return false;
    if (featureFilter === "unowned" && owned) return false;

    if (query) {
      const matchesName = item.name.toLowerCase().includes(query);
      const matchesDev = item.developer.toLowerCase().includes(query);
      const matchesPub = item.publisher.toLowerCase().includes(query);
      const matchesCat = item.category.toLowerCase().includes(query);
      if (!matchesName && !matchesDev && !matchesPub && !matchesCat) {
        return false;
      }
    }

    return true;
  });
}
