// app/api/user/wishlist/target/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { setWishlistTargetPrice } from "@/lib/db";

const MAX_TARGET_CENTS = 100_000_00;

function isValidTarget(value: unknown): value is number | null {
  return value === null || (Number.isInteger(value) && (value as number) > 0 && (value as number) <= MAX_TARGET_CENTS);
}

/** Sets the price, in cents, the owner waits for before buying a wished game; null clears it. */
export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { appId?: unknown; targetPriceCents?: unknown } | null;
  const appId = Number(body?.appId);
  if (!body || !Number.isInteger(appId) || appId <= 0 || !isValidTarget(body.targetPriceCents ?? null)) {
    return NextResponse.json({ error: "Prix cible invalide." }, { status: 400 });
  }

  if (!setWishlistTargetPrice(user.id, appId, (body.targetPriceCents ?? null) as number | null)) {
    return NextResponse.json({ error: "Jeu absent de la liste d'envies." }, { status: 404 });
  }
  return NextResponse.json({ success: true, appId, targetPriceCents: body.targetPriceCents ?? null });
}
