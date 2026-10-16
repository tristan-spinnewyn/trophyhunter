import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getUserPlatformAccounts,
  saveUserPlatformAccount,
  removeUserPlatformAccount,
} from "@/lib/db";
import type { PlatformType, PlatformAccount } from "@/lib/types";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const accounts = getUserPlatformAccounts(user.id);
  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const account: PlatformAccount = body?.account;
    const plainApiKey: string | undefined = body?.plainApiKey;

    if (!account || !account.platform || !account.username) {
      return NextResponse.json(
        { error: "Compte de plateforme invalide (plateforme et pseudo requis)." },
        { status: 400 }
      );
    }

    saveUserPlatformAccount(user.id, account, plainApiKey);
    const updatedAccounts = getUserPlatformAccounts(user.id);

    return NextResponse.json({
      success: true,
      account,
      accounts: updatedAccounts,
    });
  } catch (err: any) {
    console.error("Save platform account error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur de sauvegarde du compte de plateforme." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform") as PlatformType | null;

    if (!platform || !["steam", "xbox", "epic", "gog"].includes(platform)) {
      return NextResponse.json(
        { error: "Plateforme invalide ou manquante." },
        { status: 400 }
      );
    }

    removeUserPlatformAccount(user.id, platform);
    const updatedAccounts = getUserPlatformAccounts(user.id);

    return NextResponse.json({
      success: true,
      platform,
      accounts: updatedAccounts,
    });
  } catch (err: any) {
    console.error("Delete platform account error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la suppression du compte de plateforme." },
      { status: 500 }
    );
  }
}
