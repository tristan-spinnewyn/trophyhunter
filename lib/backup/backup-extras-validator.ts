// lib/backup/backup-extras-validator.ts
// Validates the parts of a full backup that older exports did not have.

import type { UserSettings } from "@/lib/types";
import { parseGameRef } from "@/lib/library/game-ref-input";
import { parseUserSettingsInput, DEFAULT_USER_SETTINGS } from "@/lib/settings/user-settings-input";
import { GOAL_KINDS, isGoalYear, MAX_GOAL_TARGET, type YearGoal } from "@/lib/goals/year-goals";
import { sanitizeExternalHref } from "@/lib/security/url-validator";
import type { BackupPlaySession, BackupWishlistGame } from "./backup-format";

const MAX_SESSIONS = 50_000;
const MAX_WISHLIST = 2000;
const MAX_GOALS = 300;
const MAX_STR = 256;
const MAX_SESSION_MINUTES = 24 * 60 * 7;

export interface ValidatedBackupExtras {
  readonly sessions: readonly BackupPlaySession[];
  readonly settings: UserSettings;
  readonly goals: readonly YearGoal[];
  readonly wishlist: readonly BackupWishlistGame[];
}

const asList = (value: unknown, max: number): unknown[] => (Array.isArray(value) ? value.slice(0, max) : []);
const asRecord = (value: unknown): Record<string, unknown> => (value && typeof value === "object" ? (value as Record<string, unknown>) : {});
const isIsoDate = (value: unknown): value is string => typeof value === "string" && value.length <= 64 && !Number.isNaN(Date.parse(value));

function validSession(value: unknown): BackupPlaySession | null {
  const rec = asRecord(value);
  const ref = parseGameRef(rec);
  const minutes = rec.minutes;
  if (!ref || !Number.isInteger(minutes) || (minutes as number) <= 0 || (minutes as number) > MAX_SESSION_MINUTES) return null;
  if (!isIsoDate(rec.detectedAt)) return null;
  return { ...ref, minutes: minutes as number, detectedAt: rec.detectedAt, lastPlayed: isIsoDate(rec.lastPlayed) ? rec.lastPlayed : undefined };
}

function validGoal(value: unknown): YearGoal | null {
  const rec = asRecord(value);
  if (!isGoalYear(rec.year) || !GOAL_KINDS.some((k) => k.kind === rec.kind)) return null;
  if (!Number.isInteger(rec.target) || (rec.target as number) < 1 || (rec.target as number) > MAX_GOAL_TARGET) return null;
  const baseline = Number.isInteger(rec.baseline) && (rec.baseline as number) >= 0 ? (rec.baseline as number) : null;
  return { year: rec.year, kind: rec.kind as YearGoal["kind"], target: rec.target as number, baseline };
}

function validWishlistGame(value: unknown): BackupWishlistGame | null {
  const rec = asRecord(value);
  const ref = parseGameRef(rec);
  const name = typeof rec.name === "string" ? rec.name.trim().slice(0, MAX_STR) : "";
  if (!ref || ref.appId <= 0 || !name) return null;
  const target = rec.targetPriceCents;
  return {
    ...ref,
    name,
    headerImg: typeof rec.headerImg === "string" ? sanitizeExternalHref(rec.headerImg) || undefined : undefined,
    targetPriceCents: Number.isInteger(target) && (target as number) > 0 ? (target as number) : undefined,
  };
}

const keepValid = <T>(values: unknown[], validate: (v: unknown) => T | null): T[] =>
  values.map(validate).filter((v): v is T => v !== null);

/** Keeps the valid sessions, settings, goals and wishlist games of a backup; anything malformed is dropped. */
export function validateBackupExtras(raw: Record<string, unknown>): ValidatedBackupExtras {
  const settings = parseUserSettingsInput(raw.settings);
  return {
    sessions: keepValid(asList(raw.sessions, MAX_SESSIONS), validSession),
    settings: { ...DEFAULT_USER_SETTINGS, ...(settings.ok ? settings.changes : {}) },
    goals: keepValid(asList(raw.goals, MAX_GOALS), validGoal),
    wishlist: keepValid(asList(raw.wishlist, MAX_WISHLIST), validWishlistGame),
  };
}
