// components/dashboard/library/LibraryGameStatusSelector.tsx

import type { GameStatus, OwnedGame, PlatformType } from "@/lib/types";
import {
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
    <div
      className="grid grid-cols-3 gap-1 rounded-xl border border-slate-800/80 bg-slate-950/70 p-1"
      onClick={(e) => e.stopPropagation()}
    >
      {GAME_STATUS_OPTIONS.map((opt) => {
        const isActive = currentStatus === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={!onUpdateGameStatus}
            onClick={() =>
              onUpdateGameStatus?.(game.appId, game.platform, opt.value)
            }
            className={`rounded-lg border px-1.5 py-1 text-[10px] font-bold transition ${
              isActive
                ? opt.activeButtonClass
                : "border-transparent text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
            }`}
            title={`Marquer comme "${opt.label}"`}
          >
            {opt.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
