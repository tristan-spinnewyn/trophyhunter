// components/dashboard/overview/PlatformCardActions.tsx

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
    <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
      <button
        onClick={() => onSelectPlatform(plat)}
        className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-1.5 text-xs font-bold text-sky-400 transition hover:bg-slate-700 hover:text-white"
      >
        <span>Ouvrir l&apos;espace</span>
        <ChevronRight className="h-3 w-3" />
      </button>

      <button
        onClick={() => onEditPlatform(plat)}
        title="Modifier les statistiques ou l'identifiant"
        className="rounded-xl border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        <Edit3 className="h-3.5 w-3.5" />
      </button>

      {acc && (
        <button
          onClick={() => onDisconnectPlatform(plat)}
          title="Supprimer ce compte"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
