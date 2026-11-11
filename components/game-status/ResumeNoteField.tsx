// components/game-status/ResumeNoteField.tsx
"use client";

import { useId, useState } from "react";
import { MAX_RESUME_NOTE_LENGTH } from "@/lib/game-resume/resume-note";

interface ResumeNoteFieldProps {
  readonly note?: string;
  readonly onSave: (note: string | null) => void;
}

/** A line on where the owner left off, so the game can be picked up again months later. */
export function ResumeNoteField({ note, onSave }: ResumeNoteFieldProps) {
  const fieldId = useId();
  const [draft, setDraft] = useState(note ?? "");
  const savedNote = note ?? null;

  const save = () => {
    const next = draft.trim() || null;
    if (next !== savedNote) onSave(next);
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="text-sm font-semibold text-paper-dim">
        Où tu en es
      </label>
      <textarea
        id={fieldId}
        value={draft}
        maxLength={MAX_RESUME_NOTE_LENGTH}
        rows={2}
        placeholder="Chapitre, objectif, prochaine étape… pour reprendre sans chercher."
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        className="block w-full max-w-xl resize-y rounded-control border border-edge bg-plank px-3 py-2 text-sm text-paper placeholder-faint focus:border-seam focus:outline-none"
      />
    </div>
  );
}
