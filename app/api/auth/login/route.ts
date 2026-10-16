// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/db";
import { setAuthSessionCookie } from "@/lib/auth";
import { checkRateLimit, extractClientKey } from "@/lib/security";

const LOGIN_RATE_LIMIT = { windowMs: 60_000, maxRequests: 15 };

export async function POST(req: Request) {
  const rateLimit = checkRateLimit(extractClientKey(req, "auth_login"), LOGIN_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives de connexion. Veuillez réessayer plus tard." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Veuillez fournir un nom d'utilisateur et un mot de passe." },
        { status: 400 }
      );
    }

    const user = authenticateUser(username, password);
    if (!user) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 }
      );
    }

    await setAuthSessionCookie(user.id);
    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la connexion." },
      { status: 500 }
    );
  }
}
