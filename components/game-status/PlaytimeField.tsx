// components/game-status/PlaytimeField.tsx
"use client";

import { useId, useState } from "react";

interface PlaytimeFieldProps {
  readonly playtimeHours?: number;
  /** Receives the new total of hours, once it is a readable, non-negative change. */
  readonly onChange: (hours: number) => void;
}

/** Hours played on a game no account reports playtime for, typed by the owner. */
export function PlaytimeField({ playtimeHours, onChange }: PlaytimeFieldProps) {
  const fieldId = useId();
  const saved = playtimeHours === undefined ? "" : String(playtimeHours);
  const [draft, setDraft] = useState(saved);

  const save = () => {
    const hours = Number(draft.replace(",", "."));
    if (draft.trim() === "" || !Number.isFinite(hours) || hours < 0) {
      setDraft(saved);
      return;
    }
    if (hours !== playtimeHours) onChange(hours);
  };

  return (
    <div className="flex items-center gap-3">
      <label htmlFor={fieldId} className="text-sm font-semibold text-paper-dim">
        Heures jouées
      </label>
      <input
        id={fieldId}
        type="number"
        inputMode="decimal"
        min={0}
        step={0.5}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        className="w-24 rounded-control border border-edge bg-plank px-2.5 py-1.5 text-sm text-paper focus:border-seam focus:outline-none"
      />
    </div>
  );
}
