// lib/steam/sync-html-parser.ts
const normalize = (s: string) => s.replace(/[’']/g, "'").trim().toLowerCase();

export function stripHtmlTags(input: string): string {
  let prev = input;
  let curr = input;
  do {
    prev = curr;
    curr = curr.replace(/<[^>]*>/g, "");
  } while (curr !== prev);
  return curr.trim();
}

export interface HtmlSyncParseResult {
  gameName: string;
  totalAchievements: number;
  unlockedTitles: string[];
  unlockedIds: string[];
}

export function parseSteamSyncHtml(html: string, globalHtml: string): HtmlSyncParseResult {
  let gameName = "";
  const unlockedTitles: string[] = [];
  const unlockedIds: string[] = [];

  const pageTitleMatch = html.match(/<title>(.*?)<\/title>/i);
  if (pageTitleMatch) {
    const segs = pageTitleMatch[1].replace(/&nbsp;/g, " ").split("::").map((s) => s.trim());
    if (segs.length >= 3) gameName = segs[1];
  }

  const parts = html.split(/<div[^>]*class="[^"]*achieveRow[^"]*"[^>]*>/);
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];
    const titleMatch = chunk.match(/<h3[^>]*>(.*?)<\/h3>/);
    if (!titleMatch) continue;
    if (chunk.includes("achieveUnlockTime")) {
      unlockedTitles.push(stripHtmlTags(titleMatch[1]));
    }
  }

  let totalAchievements = Math.max(0, parts.length - 1);

  if (globalHtml) {
    const globalParts = globalHtml.split(/<div[^>]*class="[^"]*achieveRow[^"]*"[^>]*>/);
    if (globalParts.length > 1) {
      totalAchievements = globalParts.length - 1;
      const remainingUnlocked = [...unlockedTitles.map(normalize)];

      for (let i = 1; i < globalParts.length; i++) {
        const block = globalParts[i];
        const tMatch = block.match(/<h3[^>]*>(.*?)<\/h3>/);
        const title = tMatch ? stripHtmlTags(tMatch[1]) : `Succès #${i}`;
        const normTitle = normalize(title);
        const idx = remainingUnlocked.indexOf(normTitle);
        if (idx !== -1) {
          const idSlug = `ach_${i}_${title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`;
          unlockedIds.push(idSlug);
          remainingUnlocked.splice(idx, 1);
        }
      }
    }
  }

  return { gameName, totalAchievements, unlockedTitles, unlockedIds };
}
