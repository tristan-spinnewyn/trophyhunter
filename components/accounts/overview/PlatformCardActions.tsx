// components/accounts/overview/PlatformCardActions.tsx

import { ChevronRight, Edit3, Trash2 } from "lucide-react";
import type { PlatformType, PlatformAccount } from "@/lib/types";

interface PlatformCardActionsProps {
  platform: PlatformType;
  account?: PlatformAccount;
  onSelectPlatform: (platform: PlatformType) => void;
  onEditPlatform: (platform: PlatformType) => void;
  onDisconnectPlatform: (platform: PlatformType) => void;
}

export function PlatformCardActions({
  platform: plat,
  account: acc,
  onSelectPlatform,
  onEditPlatform,
  onDisconnectPlatform,
}: PlatformCardActionsProps) {
  return (
    <div className="mt-3 flex items-center gap-1">
      <button
        type="button"
        onClick={() => onSelectPlatform(plat)}
        className={`flex h-8 flex-1 items-center justify-center gap-1 rounded-lg text-sm font-medium transition ${
          acc
            ? "border border-slate-800 text-slate-200 hover:bg-slate-800"
            : "border border-sky-500/40 text-sky-300 hover:bg-sky-500/10"
        }`}
      >
        <span>{acc ? "Ouvrir" : "Lier le compte"}</span>
        <ChevronRight className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => onEditPlatform(plat)}
        title="Modifier les statistiques ou l'identifiant"
        aria-label="Modifier les statistiques ou l'identifiant"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
      >
        <Edit3 className="h-4 w-4" />
      </button>

      {acc && (
        <button
          type="button"
          onClick={() => onDisconnectPlatform(plat)}
          title="Délier ce compte"
          aria-label="Délier ce compte"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-rose-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
