import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { setGameFavorite, getUserFavoriteAppIds } from "@/lib/db";
import type { PlatformType } from "@/lib/types";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const favorites = getUserFavoriteAppIds(user.id);
  return NextResponse.json({ favorites });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { appId, platform = "steam", isFavorite } = body || {};

    if (!appId) {
      return NextResponse.json({ error: "appId requis" }, { status: 400 });
    }

    setGameFavorite(user.id, Number(appId), platform as PlatformType, Boolean(isFavorite));
    return NextResponse.json({ success: true, appId: Number(appId), isFavorite: Boolean(isFavorite) });
  } catch (err: any) {
    console.error("Favorite toggle error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur de mise à jour du favori." },
      { status: 500 }
    );
  }
}
