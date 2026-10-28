// components/game-status/GameStatusSelect.tsx

import type { GameStatus } from "@/lib/types";
import {
  GAME_STATUS_META,
  GAME_STATUS_OPTIONS,
  resolveGameStatus,
} from "@/lib/game-status/game-status.services";

const NO_STATUS = "";

interface GameStatusSelectProps {
  /** Current status, or null when the game is not in the collection yet. */
  readonly status: GameStatus | null;
  readonly onChange?: (status: GameStatus) => void;
  readonly ariaLabel: string;
  /** Shown as the first option while `status` is null. */
  readonly placeholder?: string;
  readonly className?: string;
}

export function GameStatusSelect({
  status,
  onChange,
  ariaLabel,
  placeholder = "Ajouter à ma collection…",
  className = "h-8 px-2 text-xs",
}: GameStatusSelectProps) {
  const tone = status
    ? GAME_STATUS_META[status].badgeClass
    : "border-sky-500 bg-sky-500 text-slate-950";

  return (
    <select
      value={status ?? NO_STATUS}
      disabled={!onChange}
      onChange={(e) => onChange?.(resolveGameStatus(e.target.value))}
      aria-label={ariaLabel}
      className={`min-w-0 cursor-pointer rounded-md border font-medium outline-none transition focus:border-sky-400 disabled:cursor-default ${tone} ${className}`}
    >
      {status === null && (
        <option value={NO_STATUS} disabled>
          {placeholder}
        </option>
      )}
      {GAME_STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
