// app/api/user/backup/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { SyncPayloadValidationError } from "@/lib/security";
import { buildBackup } from "@/lib/backup/backup-export.services";
import { restoreBackup } from "@/lib/backup/backup-restore.services";

const unauthenticated = () => NextResponse.json({ error: "Non authentifié" }, { status: 401 });

/** The signed-in user's full backup, as a file to download. */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthenticated();

  const now = new Date();
  return NextResponse.json(buildBackup(user.id, now), {
    headers: { "Content-Disposition": `attachment; filename="trophyhunter-sauvegarde-${now.toISOString().slice(0, 10)}.json"` },
  });
}

/** Restores a full backup into the signed-in user's account. */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthenticated();

  const body: unknown = await request.json().catch(() => null);
  try {
    return NextResponse.json({ success: true, restored: restoreBackup(user.id, body) });
  } catch (err) {
    if (err instanceof SyncPayloadValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("Backup restore error:", err);
    return NextResponse.json({ error: "La sauvegarde n'a pas pu être restaurée." }, { status: 500 });
  }
}
