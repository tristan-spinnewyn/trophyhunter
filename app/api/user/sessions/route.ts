// app/api/user/sessions/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPlaySessions } from "@/lib/db";

/** The signed-in user's play sessions, latest first; `?since=<ISO date>` keeps the recent ones. */
export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const since = new URL(request.url).searchParams.get("since");
  if (since !== null && Number.isNaN(Date.parse(since))) {
    return NextResponse.json({ error: "Paramètre 'since' invalide." }, { status: 400 });
  }

  const sessions = getPlaySessions(user.id, { since: since ? new Date(since).toISOString() : undefined });
  return NextResponse.json({ sessions });
}
