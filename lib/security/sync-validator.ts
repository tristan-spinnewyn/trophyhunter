// lib/security/sync-validator.ts
import type { OwnedGame, PlatformType, UserAccountProfile, UserGameProgress } from "../types";
import { resolveGameStatus } from "../game-status/game-status.services";
import { ALLOWED_PLATFORMS, type ValidatedSyncCollection, type ValidatedSyncPayload } from "./security.types";
import { sanitizeExternalHref } from "./url-validator";

const MAX_BATCH = 2000;
const MAX_STR = 256;

export class SyncPayloadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncPayloadValidationError";
  }
}

function isPlatformType(val: string): val is PlatformType {
  return (ALLOWED_PLATFORMS as readonly string[]).includes(val);
}

export function validateSyncPayload(input: Record<string, unknown>): ValidatedSyncPayload {
  const rawGames = Array.isArray(input.games) ? input.games : [];
  if (rawGames.length > MAX_BATCH) {
    throw new SyncPayloadValidationError("Games batch exceeds maximum allowed size");
  }

  const games: OwnedGame[] = [];
  for (const item of rawGames) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const appId = Number(rec.appId);
    const platform = typeof rec.platform === "string" ? rec.platform : "";
    const name = typeof rec.name === "string" ? rec.name.trim().slice(0, MAX_STR) : "";
    if (!Number.isInteger(appId) || appId <= 0 || !isPlatformType(platform) || !name) continue;

    games.push({
      appId,
      platform,
      name,
      headerImg: sanitizeExternalHref(typeof rec.headerImg === "string" ? rec.headerImg : "") || "",
      totalAchievements: Math.max(0, Math.min(10000, Number(rec.totalAchievements) || 0)),
      unlockedCount: Math.max(0, Math.min(10000, Number(rec.unlockedCount) || 0)),
      playtimeHours: typeof rec.playtimeHours === "number" ? Math.max(0, rec.playtimeHours) : undefined,
      lastPlayed: typeof rec.lastPlayed === "string" ? rec.lastPlayed.slice(0, 64) : undefined,
      addedAt: typeof rec.addedAt === "string" ? rec.addedAt.slice(0, 64) : new Date().toISOString(),
      status: resolveGameStatus(rec.status),
    });
  }

  const rawFavs = Array.isArray(input.favorites) ? input.favorites.slice(0, MAX_BATCH) : [];
  const favorites = rawFavs.map(Number).filter((n) => Number.isInteger(n) && n > 0);

  const rawWish = Array.isArray(input.wishlist) ? input.wishlist.slice(0, MAX_BATCH) : [];
  const wishlist = rawWish.map(Number).filter((n) => Number.isInteger(n) && n > 0);

  const rawColls = Array.isArray(input.collections) ? input.collections.slice(0, 200) : [];
  const collections: ValidatedSyncCollection[] = [];
  for (const c of rawColls) {
    if (!c || typeof c !== "object") continue;
    const col = c as Record<string, unknown>;
    const cName = typeof col.name === "string" ? col.name.trim().slice(0, MAX_STR) : "";
    if (!cName) continue;
    collections.push({
      name: cName,
      description: typeof col.description === "string" ? col.description.slice(0, MAX_STR) : undefined,
      color: typeof col.color === "string" ? col.color.slice(0, 32) : undefined,
      icon: typeof col.icon === "string" ? col.icon.slice(0, 32) : undefined,
      gameIds: Array.isArray(col.gameIds) ? col.gameIds.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [],
    });
  }

  const progress: Record<string, UserGameProgress> = {};
  if (input.progress && typeof input.progress === "object") {
    const entries = Object.entries(input.progress as Record<string, unknown>);
    if (entries.length > MAX_BATCH) {
      throw new SyncPayloadValidationError("Progress entries exceed maximum allowed size");
    }
    for (const [k, v] of entries) {
      if (!v || typeof v !== "object") continue;
      const prog = v as Record<string, unknown>;
      const unlockedIds = Array.isArray(prog.unlockedIds)
        ? prog.unlockedIds.filter((id): id is string => typeof id === "string").slice(0, MAX_BATCH)
        : [];
      const notes = prog.notes && typeof prog.notes === "object" ? (prog.notes as Record<string, string>) : {};
      progress[k.slice(0, 64)] = { unlockedIds, notes };
    }
  }

  const profile =
    input.profile && typeof input.profile === "object"
      ? (input.profile as UserAccountProfile)
      : undefined;

  const steamApiKey =
    typeof input.steamApiKey === "string" && input.steamApiKey.trim().length <= 128
      ? input.steamApiKey.trim()
      : undefined;

  return { profile, games, favorites, wishlist, collections, progress, steamApiKey };
}
