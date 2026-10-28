import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserWishlist, setGameWishlist } from "@/lib/db";
import type { PlatformType } from "@/lib/types";
import { errorMessage } from "@/lib/error-message";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const wishlist = getUserWishlist(user.id);
  return NextResponse.json({ wishlist });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { appId, platform, isWishlist } = body || {};

    if (!appId || !platform) {
      return NextResponse.json(
        { error: "appId et platform sont requis." },
        { status: 400 }
      );
    }

    setGameWishlist(user.id, Number(appId), platform as PlatformType, Boolean(isWishlist));
    return NextResponse.json({ success: true, isWishlist: Boolean(isWishlist) });
  } catch (err) {
    console.error("Wishlist error:", err);
    return NextResponse.json(
      { error: errorMessage(err, "Erreur de mise à jour de la liste d'envies.") },
      { status: 400 }
    );
  }
}
