import { cookies } from "next/headers";
import { validateSession, createSession, deleteSession } from "./db";
import type { User } from "./types";

export const SESSION_COOKIE_NAME = "trophyhunter_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Retrieves the currently authenticated user from cookies, or null if not logged in.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) return null;

    return validateSession(sessionToken);
  } catch {
    return null;
  }
}


/**
 * Sets session cookie on the current request context.
 */
export async function setAuthSessionCookie(userId: string): Promise<string> {
  const sessionId = createSession(userId, 30);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return sessionId;
}

/**
 * Clears session cookie and removes session from the database.
 */
export async function clearAuthSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionToken) {
      deleteSession(sessionToken);
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (err) {
    console.error("Error clearing auth session cookie:", err);
  }
}
