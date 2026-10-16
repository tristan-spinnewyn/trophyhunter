import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserDuplicateGames } from "@/lib/db";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const duplicates = getUserDuplicateGames(user.id);
  return NextResponse.json({ duplicates });
}
