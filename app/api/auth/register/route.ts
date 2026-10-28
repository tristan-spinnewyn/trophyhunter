// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { createUser } from "@/lib/db";
import { setAuthSessionCookie } from "@/lib/auth";
import { checkRateLimit, extractClientKey } from "@/lib/security";
import { errorMessage } from "@/lib/error-message";

const REGISTER_RATE_LIMIT = { windowMs: 60_000, maxRequests: 10 };

export async function POST(req: Request) {
  const rateLimit = checkRateLimit(extractClientKey(req, "auth_register"), REGISTER_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives d'inscription. Veuillez réessayer plus tard." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json();
    const { username, password, displayName } = body || {};

    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return NextResponse.json(
        { error: "Le nom d'utilisateur doit contenir au moins 3 caractères." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }

    const user = createUser(username, password, displayName);
    await setAuthSessionCookie(user.id);

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: unknown) {
    const message = errorMessage(err, "");
    if (message.includes("already taken")) {
      return NextResponse.json(
        { error: "Ce nom d'utilisateur est déjà utilisé." },
        { status: 409 }
      );
    }
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription." },
      { status: 500 }
    );
  }
}
