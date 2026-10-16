import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getUserPlatformAccounts,
  getUserOwnedGames,
  getAllUserGameProgress,
  syncFromLocalStorage,
  getUserPlatformApiKey,
  getUserFavoriteAppIds,
  getUserWishlist,
  getUserCollections,
} from "@/lib/db";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const accounts = getUserPlatformAccounts(user.id);
  const games = getUserOwnedGames(user.id);
  const progress = getAllUserGameProgress(user.id);
  const steamApiKey = getUserPlatformApiKey(user.id, "steam");
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
    steamApiKey: steamApiKey || undefined,
  });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    syncFromLocalStorage(user.id, body || {});

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
    console.error("User sync error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation des données." },
      { status: 500 }
    );
  }
}

