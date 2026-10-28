// lib/db/collections.ts
import { getDb } from "./connection";
import type { Collection } from "../types";

export { createCollection } from "./collections-create";
export { addGameToCollection, removeGameFromCollection, getCollectionGames } from "./collections-games";
export { setGameWishlist, setGameFavorite, getUserFavoriteAppIds, getUserWishlist } from "./wishlist";
export { getUserDuplicateGames } from "./duplicates";
export { clearAllUserData } from "./clear";

export function getUserCollections(userId: string): Collection[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.id, c.user_id, c.name, c.description, c.color, c.icon, c.created_at,
              COUNT(cg.user_game_id) as game_count
       FROM collections c
       LEFT JOIN collection_games cg ON c.id = cg.collection_id
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY c.created_at ASC`
    )
    .all(userId) as Array<{
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    created_at: string;
    game_count: number;
  }>;

  const gameLinks = db
    .prepare(
      `SELECT cg.collection_id, ug.app_id
       FROM collection_games cg
       JOIN user_games ug ON cg.user_game_id = ug.id
       JOIN collections c ON cg.collection_id = c.id
       WHERE c.user_id = ?`
    )
    .all(userId) as Array<{ collection_id: string; app_id: number }>;

  const gameIdsByColl = new Map<string, number[]>();
  for (const link of gameLinks) {
    const list = gameIdsByColl.get(link.collection_id) || [];
    if (!list.includes(link.app_id)) {
      list.push(link.app_id);
      gameIdsByColl.set(link.collection_id, list);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    description: r.description || undefined,
    color: r.color || undefined,
    icon: r.icon || undefined,
    createdAt: r.created_at,
    gameCount: r.game_count,
    gameIds: gameIdsByColl.get(r.id) || [],
  }));
}

export function deleteCollection(userId: string, collectionId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM collections WHERE id = ? AND user_id = ?").run(collectionId, userId);
}
