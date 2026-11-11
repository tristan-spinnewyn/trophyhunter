// lib/settings/user-settings-input.ts
import type { UserSettings } from "@/lib/types";

/** The intervals the settings offer; anything else is refused rather than rounded. */
export const AUTO_SYNC_HOUR_CHOICES = [6, 12, 24] as const;
export const STALE_WEEKS_RANGE = { min: 1, max: 52 } as const;

export type UserSettingsInput =
  | { readonly ok: true; readonly changes: Partial<UserSettings> }
  | { readonly ok: false; readonly error: string };

function isValidAutoSyncHours(value: unknown): value is UserSettings["autoSyncHours"] {
  return value === null || (AUTO_SYNC_HOUR_CHOICES as readonly unknown[]).includes(value);
}

function isValidStaleWeeks(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= STALE_WEEKS_RANGE.min && (value as number) <= STALE_WEEKS_RANGE.max;
}

/** Validates a settings change sent by the client; only known fields are kept. */
export function parseUserSettingsInput(body: unknown): UserSettingsInput {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Réglages invalides." };
  const input = body as Record<string, unknown>;
  const changes: { autoSyncHours?: number | null; staleAfterWeeks?: number } = {};

  if ("autoSyncHours" in input) {
    if (!isValidAutoSyncHours(input.autoSyncHours)) return { ok: false, error: "Intervalle de synchronisation invalide." };
    changes.autoSyncHours = input.autoSyncHours;
  }
  if ("staleAfterWeeks" in input) {
    if (!isValidStaleWeeks(input.staleAfterWeeks)) return { ok: false, error: "Nombre de semaines invalide." };
    changes.staleAfterWeeks = input.staleAfterWeeks;
  }
  return { ok: true, changes };
}
