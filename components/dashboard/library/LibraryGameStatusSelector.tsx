// components/dashboard/library/LibraryGameStatusSelector.tsx

import type { GameStatus, OwnedGame, PlatformType } from "@/lib/types";
import {
  GAME_STATUS_META,
  GAME_STATUS_OPTIONS,
  resolveGameStatus,
} from "@/lib/game-status/game-status.services";

interface LibraryGameStatusSelectorProps {
  readonly game: OwnedGame;
  readonly onUpdateGameStatus?: (
    appId: number,
    platform: PlatformType,
    status: GameStatus
  ) => Promise<void> | void;
}

export function LibraryGameStatusSelector({
  game,
  onUpdateGameStatus,
}: LibraryGameStatusSelectorProps) {
  const currentStatus = resolveGameStatus(game.status);

  return (
    <select
      value={currentStatus}
      disabled={!onUpdateGameStatus}
      onChange={(e) =>
        onUpdateGameStatus?.(game.appId, game.platform, resolveGameStatus(e.target.value))
      }
      aria-label={`Statut de ${game.name}`}
      className={`h-8 min-w-0 cursor-pointer rounded-md border px-2 text-xs font-medium outline-none transition focus:border-sky-500 disabled:cursor-default ${GAME_STATUS_META[currentStatus].badgeClass}`}
    >
      {GAME_STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
