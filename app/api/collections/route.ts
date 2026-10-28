import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserCollections, createCollection } from "@/lib/db";
import { errorMessage } from "@/lib/error-message";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const collections = getUserCollections(user.id);
  return NextResponse.json({ collections });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, color, icon } = body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Le nom de la collection est requis." },
        { status: 400 }
      );
    }

    const collection = createCollection(
      user.id,
      name,
      description,
      color,
      icon
    );

    return NextResponse.json({ collection }, { status: 201 });
  } catch (err) {
    console.error("Create collection error:", err);
    return NextResponse.json(
      { error: errorMessage(err, "Erreur lors de la création de la collection.") },
      { status: 400 }
    );
  }
}
