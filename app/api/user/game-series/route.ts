// app/api/user/game-series/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { parseGameRef } from "@/lib/library/game-ref-input";
import { getSeriesForGame } from "@/lib/series/game-series.services";

/** The series of a game of the collection: `?platform=steam&appId=620`; `series` is null when there is none. */
export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const appIdParam = params.get("appId");
  const ref = parseGameRef({ platform: params.get("platform"), appId: appIdParam ? Number(appIdParam) : Number.NaN });
  if (!ref) return NextResponse.json({ error: "Jeu invalide." }, { status: 400 });

  try {
    return NextResponse.json({ series: await getSeriesForGame(user.id, ref, new Date()) });
  } catch (err) {
    // IGDB down: the page simply shows no series.
    console.error("Game series lookup failed:", err);
    return NextResponse.json({ series: null });
  }
}
