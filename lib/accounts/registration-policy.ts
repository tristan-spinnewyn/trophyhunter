// lib/accounts/registration-policy.ts
import { hasAnyUser } from "@/lib/db";

/**
 * TrophyHunter is self-hosted for a single owner: sign-up is open until the first
 * account exists, then closed. ALLOW_REGISTRATION=true keeps it open for instances
 * shared on purpose.
 */
export function isRegistrationOpen(): boolean {
  if (process.env.ALLOW_REGISTRATION?.trim().toLowerCase() === "true") return true;
  return !hasAnyUser();
}
