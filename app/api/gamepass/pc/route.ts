// app/api/gamepass/pc/route.ts

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { anonymousRateLimitResponse } from "@/lib/security/anonymous-rate-limit";
import { unstable_rethrow } from "next/navigation";
import { fetchPcGamePassCatalog } from "@/lib/gamepass/catalog.services";
import { GamePassCatalogError } from "@/lib/gamepass/gamepass.types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "1";
    const rateLimited = anonymousRateLimitResponse(request, Boolean(await getAuthenticatedUser()));
    if (rateLimited) return rateLimited;
    const { games, fetchedAt } = await fetchPcGamePassCatalog({ forceRefresh });

    return NextResponse.json({
      games,
      total: games.length,
      fetchedAt,
    });
  } catch (error: unknown) {
    // Next.js throws internal signals (e.g. "this route is dynamic" during the build): they must propagate.
    unstable_rethrow(error);
    if (error instanceof GamePassCatalogError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("PC Game Pass catalog error:", error);
    return NextResponse.json(
      { error: "Impossible de charger le catalogue PC Game Pass." },
      { status: 500 }
    );
  }
}
