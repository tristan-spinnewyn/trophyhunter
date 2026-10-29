// app/api/user/sync/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getUserPlatformAccounts,
  getUserOwnedGames,
  getAllUserGameProgress,
  syncFromLocalStorage,
  getUserFavoriteAppIds,
  getUserWishlist,
  getUserCollections,
} from "@/lib/db";
import { validateSyncPayload, SyncPayloadValidationError } from "@/lib/security";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const accounts = getUserPlatformAccounts(user.id);
  const games = getUserOwnedGames(user.id);
  const progress = getAllUserGameProgress(user.id);
  const favorites = getUserFavoriteAppIds(user.id);
  const wishlist = getUserWishlist(user.id).map((g) => g.appId);
  const collections = getUserCollections(user.id);

  return NextResponse.json({
    user,
    profile: {
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      accounts,
    },
    games,
    progress,
    favorites,
    wishlist,
    collections,
    // Keys never leave the server: the page only learns whether one is saved.
    hasSteamApiKey: Boolean(accounts.steam?.hasApiKey),
  });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const rawBody = (await req.json()) as Record<string, unknown>;
    const validated = validateSyncPayload(rawBody || {});
    syncFromLocalStorage(user.id, {
      profile: validated.profile,
      games: [...validated.games],
      favorites: [...validated.favorites],
      wishlist: [...validated.wishlist],
      collections: validated.collections.map((c) => ({
        ...c,
        gameIds: c.gameIds ? [...c.gameIds] : undefined,
      })),
      progress: { ...validated.progress },
      steamApiKey: validated.steamApiKey,
    });

    const accounts = getUserPlatformAccounts(user.id);
    const games = getUserOwnedGames(user.id);
    const progress = getAllUserGameProgress(user.id);
    const favorites = getUserFavoriteAppIds(user.id);
    const wishlist = getUserWishlist(user.id).map((g) => g.appId);
    const collections = getUserCollections(user.id);

    return NextResponse.json({
      success: true,
      message: "Synchronisation réussie avec la base de données.",
      profile: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        accounts,
      },
      games,
      progress,
      favorites,
      wishlist,
      collections,
      gamesCount: games.length,
      progressCount: Object.keys(progress).length,
    });
  } catch (err) {
    if (err instanceof SyncPayloadValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("User sync error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation des données." },
      { status: 500 }
    );
  }
}
