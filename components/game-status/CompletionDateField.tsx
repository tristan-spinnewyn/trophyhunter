// components/game-status/CompletionDateField.tsx
"use client";

import { useId, useState } from "react";
import {
  EARLIEST_COMPLETION_DAY,
  completionDateFromInput,
  completionDateToInput,
} from "@/lib/library/completion-date";

interface CompletionDateFieldProps {
  readonly completedAt?: string;
  /** Receives the picked day as "YYYY-MM-DD", once it is a whole, plausible day. */
  readonly onChange: (day: string) => void;
}

/** When a finished game was finished, so it lands on the right year of the finished shelf. */
export function CompletionDateField({ completedAt, onChange }: CompletionDateFieldProps) {
  const saved = completionDateToInput(completedAt);
  // Restarting the field when the saved date changes drops any half-typed draft.
  return <CompletionDateInput key={saved} saved={saved} onChange={onChange} />;
}

function CompletionDateInput({ saved, onChange }: { readonly saved: string; readonly onChange: (day: string) => void }) {
  const inputId = useId();
  const hintId = useId();
  // The field keeps what is being typed: a date field reports every partial year ("0002", "0020"…).
  const [draft, setDraft] = useState(saved);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <label htmlFor={inputId} className="text-sm font-semibold text-paper-dim">
          Terminé le
        </label>
        <input
          id={inputId}
          type="date"
          value={draft}
          min={EARLIEST_COMPLETION_DAY}
          max={today}
          aria-describedby={saved ? undefined : hintId}
          onChange={(e) => {
            setDraft(e.target.value);
            if (completionDateFromInput(e.target.value, new Date())) onChange(e.target.value);
          }}
          className="rounded-control border border-edge bg-plank px-2.5 py-1.5 text-sm text-paper [color-scheme:dark] focus:border-seam focus:outline-none"
        />
      </div>
      {!saved && (
        <p id={hintId} className="text-sm text-dust">
          Date inconnue : indique-la pour ranger ce jeu dans son année.
        </p>
      )}
    </div>
  );
}
