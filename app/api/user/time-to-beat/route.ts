// app/api/user/time-to-beat/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPlannedTimeToBeat } from "@/lib/igdb/planned-time-to-beat";

/** How long the games still ahead (backlog, in progress, paused) take to beat. Signed-in users only, so nobody else spends the IGDB quota. */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return NextResponse.json({ durations: await getPlannedTimeToBeat(user.id) });
}
