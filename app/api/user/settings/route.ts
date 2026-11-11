// app/api/user/settings/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserSettings, saveUserSettings } from "@/lib/db";
import { parseUserSettingsInput } from "@/lib/settings/user-settings-input";

const unauthenticated = () => NextResponse.json({ error: "Non authentifié" }, { status: 401 });

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthenticated();
  return NextResponse.json({ settings: getUserSettings(user.id) });
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthenticated();

  const body: unknown = await request.json().catch(() => null);
  const input = parseUserSettingsInput(body);
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });

  return NextResponse.json({ settings: saveUserSettings(user.id, input.changes) });
}
