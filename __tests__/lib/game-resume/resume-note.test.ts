// __tests__/lib/game-resume/resume-note.test.ts
import { describe, it, expect } from "vitest";
import {
  MAX_RESUME_NOTE_LENGTH,
  canHaveResumeNote,
  describeResumeNote,
  parseResumeNoteInput,
} from "@/lib/game-resume/resume-note";

describe("canHaveResumeNote", () => {
  it("offers a note on games being played or set aside for later", () => {
    expect(canHaveResumeNote("in-progress")).toBe(true);
    expect(canHaveResumeNote("paused")).toBe(true);
  });

  it("offers none on games not started or behind you", () => {
    for (const status of ["unsorted", "backlog", "completed", "abandoned", "not-interested"] as const) {
      expect(canHaveResumeNote(status)).toBe(false);
    }
    expect(canHaveResumeNote(undefined)).toBe(false);
  });
});

describe("parseResumeNoteInput", () => {
  it("trims the note", () => {
    expect(parseResumeNoteInput("  Chapitre 4, aller voir le forgeron. ")).toEqual({ ok: true, note: "Chapitre 4, aller voir le forgeron." });
  });

  it("treats a blank or missing note as cleared", () => {
    expect(parseResumeNoteInput("   ")).toEqual({ ok: true, note: null });
    expect(parseResumeNoteInput(null)).toEqual({ ok: true, note: null });
    expect(parseResumeNoteInput(undefined)).toEqual({ ok: true, note: null });
  });

  it("rejects a note that is not text or too long", () => {
    expect(parseResumeNoteInput(42)).toMatchObject({ ok: false });
    expect(parseResumeNoteInput("a".repeat(MAX_RESUME_NOTE_LENGTH + 1))).toMatchObject({ ok: false });
    expect(parseResumeNoteInput("a".repeat(MAX_RESUME_NOTE_LENGTH))).toMatchObject({ ok: true });
  });
});

describe("describeResumeNote", () => {
  it("phrases the note as where you left off", () => {
    expect(describeResumeNote("Boss du chapitre 3")).toBe("Où tu en étais : Boss du chapitre 3");
  });

  it("says nothing without a note", () => {
    expect(describeResumeNote(undefined)).toBeNull();
  });
});
