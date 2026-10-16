import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { deleteCollection } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  deleteCollection(user.id, id);
  return NextResponse.json({ success: true });
}
