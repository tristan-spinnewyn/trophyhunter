// lib/steam/game-metadata.ts
// Client-safe: achievement and title helpers shared by Steam, Xbox, Epic and the UI.

export const MISSABLE_KEYWORDS = [
  "sans mourir",
  "en moins de",
  "chronométré",
  "choix",
  "décision",
  "toutes les fins",
  "fin secrète",
  "manquable",
  "rater",
  "speedrun",
  "sans utiliser",
  "sans tuer",
  "discrétion",
  "100%",
  "tous les collectibles",
  "tous les objets",
  "difficulté maximale",
  "en une seule partie",
];

export function isLikelyMissable(title: string, desc: string): boolean {
  const combined = `${title} ${desc}`.toLowerCase();
  return MISSABLE_KEYWORDS.some((kw) => combined.includes(kw));
}

export function cleanTitleForSearch(title: string): string {
  if (!title) return "";
  const trimmed = title.slice(0, 300);
  return trimmed
    .replace(/[®™©]/g, "")
    .replace(/\([^()]*\)|\[[^[\]]*\]/g, "")
    .replace(/ - Definitive Edition/gi, "")
    .replace(/ - Game of the Year Edition/gi, "")
    .replace(/ - Standard Edition/gi, "")
    .replace(/ - Complete Edition/gi, "")
    .replace(/ - Deluxe Edition/gi, "")
    .replace(/ Enhanced Edition/gi, "")
    .replace(/ Director's Cut/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeForComparison(title: string): string {
  return cleanTitleForSearch(title).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function findBestSteamMatch(
  items: Array<{ id?: number; name?: string }>,
  targetName: string
): { id?: number; name?: string } | undefined {
  if (!Array.isArray(items) || items.length === 0) return undefined;
  const targetNorm = normalizeForComparison(targetName);
  if (targetNorm) {
    const exact = items.find((it) => it.name && normalizeForComparison(it.name) === targetNorm);
    if (exact) return exact;
    const startsWith = items.find((it) => {
      if (!it.name) return false;
      const itemNorm = normalizeForComparison(it.name);
      return itemNorm.startsWith(targetNorm) || targetNorm.startsWith(itemNorm);
    });
    if (startsWith) return startsWith;
  }
  return items[0];
}

export function buildPsthcGuideUrl(gameName: string): string {
  const cleanName = cleanTitleForSearch(gameName).trim();
  const query = cleanName.length > 0 ? cleanName : gameName.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(`site:psthc.fr ${query} guide`)}`;
}
