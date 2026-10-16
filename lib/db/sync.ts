import { getDb, withTransaction } from "./connection";
import { saveUserPlatformAccount } from "./accounts";
import { saveUserOwnedGames } from "./games";
import { saveUserGameProgress } from "./progress";
import { createCollection, addGameToCollection } from "./collections";
import type { DatabaseSyncPayload, PlatformType } from "../types";

export function syncFromLocalStorage(
  userId: string,
  payload: DatabaseSyncPayload
): void {
  const db = getDb();

  withTransaction(db, () => {
    // 1. Sync Profile & Connected accounts
    if (payload.profile?.accounts) {
      for (const [plat, acc] of Object.entries(payload.profile.accounts)) {
        if (acc) {
          const plainKey =
            plat === "steam" && payload.steamApiKey
              ? payload.steamApiKey
              : undefined;
          saveUserPlatformAccount(userId, acc, plainKey);
        }
      }
    }

    // 2. Sync Owned Games
    if (payload.games && payload.games.length > 0) {
      saveUserOwnedGames(userId, payload.games);
    }

    // 3. Sync Progress
    if (payload.progress) {
      for (const [key, prog] of Object.entries(payload.progress)) {
        const parts = key.split("_");
        const appIdStr = parts[parts.length - 1];
        const appId = parseInt(appIdStr, 10);
        if (!isNaN(appId)) {
          const plat =
            parts.length > 2 &&
            ["steam", "xbox", "epic", "gog"].includes(parts[parts.length - 2])
              ? (parts[parts.length - 2] as PlatformType)
              : "steam";
          saveUserGameProgress(userId, appId, plat, prog);
        }
      }
    }

    // 4. Sync Favorites
    if (payload.favorites && Array.isArray(payload.favorites)) {
      for (const appId of payload.favorites) {
        db.prepare(
          "UPDATE user_games SET is_favorite = 1 WHERE user_id = ? AND app_id = ?"
        ).run(userId, Number(appId));
      }
    }

    // 5. Sync Wishlist
    if (payload.wishlist && Array.isArray(payload.wishlist)) {
      for (const appId of payload.wishlist) {
        db.prepare(
          "UPDATE user_games SET is_wishlist = 1 WHERE user_id = ? AND app_id = ?"
        ).run(userId, Number(appId));
      }
    }

    // 6. Sync Collections
    if (payload.collections && Array.isArray(payload.collections)) {
      for (const coll of payload.collections) {
        if (!coll || !coll.name) continue;
        const created = createCollection(
          userId,
          coll.name,
          coll.description,
          coll.color,
          coll.icon
        );
        if (Array.isArray(coll.gameIds)) {
          for (const gId of coll.gameIds) {
            try {
              addGameToCollection(userId, created.id, Number(gId), "steam");
            } catch {
              // ignore if game not in library
            }
          }
        }
      }
    }
  });
}
