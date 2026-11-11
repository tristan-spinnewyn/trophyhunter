// lib/game-resume/resume-note.ts
import type { GameStatus } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";

export const MAX_RESUME_NOTE_LENGTH = 500;

export type ResumeNoteInput = { readonly ok: true; readonly note: string | null } | { readonly ok: false; readonly error: string };

/** Where you left off only matters for a game you are playing or have set aside to come back to. */
export function canHaveResumeNote(status: GameStatus | undefined): boolean {
  if (!status) return false;
  const resolved = resolveGameStatus(status);
  return resolved === "in-progress" || resolved === "paused";
}

/** Validates a resume note: trimmed text, blank or missing meaning cleared. */
export function parseResumeNoteInput(value: unknown): ResumeNoteInput {
  if (value === null || value === undefined) return { ok: true, note: null };
  if (typeof value !== "string") return { ok: false, error: "Note de reprise invalide." };
  const note = value.trim() || null;
  if (note && note.length > MAX_RESUME_NOTE_LENGTH) {
    return { ok: false, error: `La note de reprise ne peut pas dépasser ${MAX_RESUME_NOTE_LENGTH} caractères.` };
  }
  return { ok: true, note };
}

/** "Où tu en étais : …", or null for a game without a note. */
export function describeResumeNote(note: string | undefined): string | null {
  return note ? `Où tu en étais : ${note}` : null;
}
