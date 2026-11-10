// components/game-status/GameStatusPicker.tsx

"use client";

import { useId, type KeyboardEvent } from "react";
import type { GameStatus } from "@/lib/types";
import { GAME_STATUS_OPTIONS, VALID_GAME_STATUSES } from "@/lib/game-status/game-status.services";

interface GameStatusPickerProps {
  /** Current status, or null when the game is not in the collection yet. */
  readonly status: GameStatus | null;
  readonly onChange: (status: GameStatus) => void;
}

const ORDER = GAME_STATUS_OPTIONS.map((o) => o.value);
const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** Every status side by side, each with its shelf colour; a WAI-ARIA radio group. */
export function GameStatusPicker({ status, onChange }: GameStatusPickerProps) {
  const hintId = useId();
  const focusable = status ?? VALID_GAME_STATUSES[0];

  const onKeyDown = (current: GameStatus) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = STEP[e.key];
    if (!step) return;
    e.preventDefault();
    const next = ORDER[(ORDER.indexOf(current) + step + ORDER.length) % ORDER.length];
    onChange(next);
    const group = e.currentTarget.parentElement;
    group?.querySelector<HTMLButtonElement>(`[data-status="${next}"]`)?.focus();
  };

  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label="Statut du jeu"
        aria-describedby={status === null ? hintId : undefined}
        className="-mx-4 flex gap-1.5 overflow-x-auto scrollbar-none px-4 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {GAME_STATUS_OPTIONS.map((opt) => {
          const checked = opt.value === status;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={opt.value === focusable ? 0 : -1}
              data-status={opt.value}
              onClick={() => onChange(opt.value)}
              onKeyDown={onKeyDown(opt.value)}
              className={`flex shrink-0 items-center gap-2 rounded-control border px-3 py-2 text-sm font-semibold transition ${
                checked ? "border-current bg-plank text-paper" : "border-edge text-dust hover:border-seam hover:text-paper"
              }`}
              style={checked ? { borderColor: `var(--${dotToken(opt.dotClass)})` } : undefined}
            >
              <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${opt.dotClass} ${checked ? "" : "opacity-50"}`} />
              {opt.label}
            </button>
          );
        })}
      </div>
      {status === null && (
        <p id={hintId} className="text-sm text-dust">
          Choisis un statut pour l&apos;ajouter à ta collection.
        </p>
      )}
    </div>
  );
}

/** "bg-lamp" -> "lamp": the checked border uses the same token as the dot. */
function dotToken(dotClass: string): string {
  return dotClass.replace(/^bg-/, "");
}
