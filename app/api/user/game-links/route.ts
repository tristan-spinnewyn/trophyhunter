// app/api/user/game-links/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { linkGames, unlinkGames } from "@/lib/db";
import { parseGameRef } from "@/lib/library/game-ref-input";
import type { GameRef } from "@/lib/types";

const MAX_COPIES = 20;
const unauthenticated = () => NextResponse.json({ error: "Non authentifié" }, { status: 401 });
const badRequest = () => NextResponse.json({ error: "Jeux à fusionner invalides." }, { status: 400 });

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json().catch(() => null);
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

/** Merges copies of a game owned on other platforms into it: { primary, copies }. */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthenticated();

  const body = await readBody(request);
  const primary = parseGameRef(body.primary);
  const rawCopies = Array.isArray(body.copies) ? body.copies.slice(0, MAX_COPIES) : [];
  const copies = rawCopies.map(parseGameRef);
  if (!primary || copies.length === 0 || copies.some((c) => c === null)) return badRequest();

  if (!linkGames(user.id, primary, copies as GameRef[])) {
    return NextResponse.json({ error: "Jeux absents de la collection." }, { status: 404 });
  }
  return NextResponse.json({ success: true, primary, copies });
}

/** Unmerges every copy of a primary game: { primary }. */
export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthenticated();

  const primary = parseGameRef((await readBody(request)).primary);
  if (!primary) return badRequest();
  if (!unlinkGames(user.id, primary)) {
    return NextResponse.json({ error: "Aucune copie fusionnée." }, { status: 404 });
  }
  return NextResponse.json({ success: true, primary });
}
