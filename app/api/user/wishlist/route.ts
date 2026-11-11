import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserWishlist, setGameWishlist } from "@/lib/db";
import type { PlatformType } from "@/lib/types";
import { errorMessage } from "@/lib/error-message";
import { sanitizeExternalHref } from "@/lib/security/url-validator";

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
    const { appId, platform, isWishlist, name, headerImg } = body || {};

    if (!appId || !platform) {
      return NextResponse.json(
        { error: "appId et platform sont requis." },
        { status: 400 }
      );
    }

    // A game not in the collection yet is shown from these, so only safe text and links are kept.
    setGameWishlist(user.id, Number(appId), platform as PlatformType, Boolean(isWishlist), {
      name: typeof name === "string" ? name.trim().slice(0, 200) : undefined,
      headerImg: typeof headerImg === "string" ? sanitizeExternalHref(headerImg) || undefined : undefined,
    });
    return NextResponse.json({ success: true, isWishlist: Boolean(isWishlist) });
  } catch (err) {
    console.error("Wishlist error:", err);
    return NextResponse.json(
      { error: errorMessage(err, "Erreur de mise à jour de la liste d'envies.") },
      { status: 400 }
    );
  }
}
