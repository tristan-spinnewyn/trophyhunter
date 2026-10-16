// lib/steam/sync-xml-parser.ts
const normalize = (s: string) => s.replace(/[’']/g, "'").trim().toLowerCase();

export interface XmlSyncParseResult {
  gameName: string;
  totalAchievements: number;
  unlockedTitles: string[];
  unlockedIds: string[];
}

export function parseSteamSyncXml(html: string, schemaAchievements: any[] | null): XmlSyncParseResult {
  let gameName = "";
  const unlockedTitles: string[] = [];
  const unlockedIds: string[] = [];

  const gnMatch = html.match(/<gameName><!\[CDATA\[(.*?)\]\]><\/gameName>|<gameName>(.*?)<\/gameName>/);
  if (gnMatch) gameName = gnMatch[1] || gnMatch[2] || "";

  const blocks = html.split(/<achievement\s+/).slice(1);
  const unlockedApis = new Set<string>();
  const unlockedNames = new Set<string>();
  const xmlAchievements: { api: string; name: string; isClosed: boolean }[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const isClosed = block.includes('closed="1"') || block.includes("closed='1'");
    const apiMatch = block.match(/<apiname><!\[CDATA\[(.*?)\]\]><\/apiname>|<apiname>(.*?)<\/apiname>/);
    const nameMatch = block.match(/<name><!\[CDATA\[(.*?)\]\]><\/name>|<name>(.*?)<\/name>/);
    const api = (apiMatch ? apiMatch[1] || apiMatch[2] : "").trim();
    const name = (nameMatch ? nameMatch[1] || nameMatch[2] : `Succès #${i + 1}`).trim();

    xmlAchievements.push({ api, name, isClosed });
    if (isClosed) {
      if (api) unlockedApis.add(api.toLowerCase());
      if (name) unlockedNames.add(normalize(name));
    }
  }

  let totalAchievements = 0;
  if (schemaAchievements && schemaAchievements.length > 0) {
    totalAchievements = schemaAchievements.length;
    for (let idx = 0; idx < schemaAchievements.length; idx++) {
      const ach = schemaAchievements[idx];
      const i = idx + 1;
      const title = ach.localized_name || ach.internal_name || `Succès #${i}`;
      const idSlug = `ach_${i}_${title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`;
      const apiLower = (ach.internal_name || "").toLowerCase();

      const isUnlocked =
        unlockedApis.has(apiLower) ||
        unlockedNames.has(normalize(title)) ||
        unlockedNames.has(normalize(ach.internal_name || ""));

      if (isUnlocked) {
        unlockedIds.push(idSlug);
        unlockedTitles.push(title);
      }
    }
  } else {
    totalAchievements = xmlAchievements.length;
    for (let idx = 0; idx < xmlAchievements.length; idx++) {
      const ach = xmlAchievements[idx];
      const i = idx + 1;
      const idSlug = `ach_${i}_${ach.name.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`;
      if (ach.isClosed) {
        unlockedIds.push(idSlug);
        unlockedTitles.push(ach.name);
      }
    }
  }

  return { gameName, totalAchievements, unlockedTitles, unlockedIds };
}
