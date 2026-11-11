// components/settings/StaleReminderSettingsSection.tsx
"use client";

import { useState } from "react";
import { Hourglass } from "lucide-react";
import type { UserSettings } from "@/lib/types";
import { STALE_WEEKS_RANGE } from "@/lib/settings/user-settings-input";

interface StaleReminderSettingsSectionProps {
  readonly settings: UserSettings;
  readonly onChange: (changes: Partial<UserSettings>) => void;
}

const isValidWeeks = (weeks: number) => Number.isInteger(weeks) && weeks >= STALE_WEEKS_RANGE.min && weeks <= STALE_WEEKS_RANGE.max;

/** How long an in-progress game may go untouched before the collection suggests pausing it. */
export function StaleReminderSettingsSection({ settings, onChange }: StaleReminderSettingsSectionProps) {
  const [draft, setDraft] = useState(String(settings.staleAfterWeeks));

  const save = () => {
    const weeks = Number(draft);
    if (!isValidWeeks(weeks)) {
      setDraft(String(settings.staleAfterWeeks));
      return;
    }
    if (weeks !== settings.staleAfterWeeks) onChange({ staleAfterWeeks: weeks });
  };

  return (
    <div className="rounded-sheet border border-edge bg-plank p-4">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-paper">
        <Hourglass className="h-4 w-4" aria-hidden />
        Jeux en cours délaissés
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor="stale-after-weeks" className="text-xs text-paper-dim">
          Semaines sans jouer avant le rappel
        </label>
        <input
          id="stale-after-weeks"
          type="number"
          inputMode="numeric"
          min={STALE_WEEKS_RANGE.min}
          max={STALE_WEEKS_RANGE.max}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          className="w-20 rounded-control border border-seam bg-ink px-3 py-1.5 text-xs text-paper outline-none focus:border-lamp"
        />
      </div>
      <p className="mt-2 text-[11px] text-dust">
        Passé ce délai sans session, ta collection te propose de mettre le jeu en pause.
      </p>
    </div>
  );
}
