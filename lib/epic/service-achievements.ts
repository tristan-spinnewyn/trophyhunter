// lib/epic/service-achievements.ts
import type { OwnedGame } from "@/lib/types";
import { resolveEpicCodename, isUnsplashPlaceholder, DEFAULT_EPIC_COVER } from "@/lib/epic-codenames";
import { isJunkHex, hashCode, normalizeTitle } from "./helpers";
import type { AchSummary } from "./types";

export function matchAndEnrichSandboxAchievements(
  discoveredGames: OwnedGame[],
  gameNamespaceMap: Map<number, string>,
  achBySandbox: Map<string, AchSummary>,
  nowIso: string
): void {
  for (const g of discoveredGames) {
    const ns = gameNamespaceMap.get(g.appId)?.toLowerCase();
    let ach = ns ? achBySandbox.get(ns) : undefined;

    if (!ach) {
      const normGameTitle = normalizeTitle(g.name);
      for (const [sId, a] of achBySandbox.entries()) {
        const cleanSid = sId.replace(/^ns_?/, "").replace(/_?sandbox$/, "").replace(/[^a-z0-9]/g, "");
        if (
          cleanSid === normGameTitle ||
          (cleanSid.length >= 4 && normGameTitle.startsWith(cleanSid)) ||
          (normGameTitle.length >= 4 && cleanSid.startsWith(normGameTitle)) ||
          (a.gameTitle && normalizeTitle(a.gameTitle) === normGameTitle)
        ) {
          ach = a;
          break;
        }
      }
    }

    if (ach) {
      g.totalAchievements = ach.totalAchievements;
      g.unlockedCount = ach.totalUnlocked;
      if (ach.coverUrl && (!g.headerImg || isUnsplashPlaceholder(g.headerImg))) {
        g.headerImg = ach.coverUrl;
      }
    }
  }

  for (const [sId, ach] of achBySandbox.entries()) {
    const alreadyInGames = discoveredGames.some((g) => {
      const gNs = gameNamespaceMap.get(g.appId)?.toLowerCase();
      const cleanSid = sId.replace(/^ns_?/, "").replace(/_?sandbox$/, "").replace(/[^a-z0-9]/g, "");
      const normGameTitle = normalizeTitle(g.name);
      return (
        gNs === sId || cleanSid === normGameTitle ||
        (cleanSid.length >= 4 && normGameTitle.startsWith(cleanSid)) ||
        (normGameTitle.length >= 4 && cleanSid.startsWith(normGameTitle)) ||
        (ach.gameTitle && normalizeTitle(g.name) === normalizeTitle(ach.gameTitle))
      );
    });

    if (!alreadyInGames && (ach.totalAchievements > 0 || ach.totalUnlocked > 0)) {
      const syntheticId = Math.abs(hashCode(`epic_ach_${sId}`));
      let resolvedTitle = ach.gameTitle || sId.replace(/^ns_?/, "").replace(/_?sandbox$/, "").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
      if (!resolvedTitle || isJunkHex(resolvedTitle)) {
        resolvedTitle = resolveEpicCodename(sId) || `Jeu Epic (${sId.slice(0, 8).toUpperCase()})`;
      }

      gameNamespaceMap.set(syntheticId, sId);
      discoveredGames.push({
        appId: syntheticId, name: resolvedTitle, headerImg: ach.coverUrl || DEFAULT_EPIC_COVER,
        platform: "epic", totalAchievements: ach.totalAchievements, unlockedCount: ach.totalUnlocked,
        addedAt: nowIso, source: "manual",
      });
    }
  }
}
