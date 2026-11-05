// components/accounts/overview/PlatformCardActions.tsx

import { Edit3, Trash2 } from "lucide-react";
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
    <div className="flex items-center gap-1 self-start md:self-center">
      <button
        type="button"
        onClick={() => onSelectPlatform(plat)}
        className="flex h-9 items-center justify-center gap-1 rounded-control border border-edge bg-plank px-3.5 text-sm font-bold text-paper transition hover:border-seam"
      >
        <span>{acc ? "Ouvrir" : "Lier le compte"}</span>
      </button>

      <button
        type="button"
        onClick={() => onEditPlatform(plat)}
        title="Modifier les statistiques ou l'identifiant"
        aria-label="Modifier les statistiques ou l'identifiant"
        className="flex h-8 w-8 items-center justify-center rounded-control text-faint transition hover:bg-edge hover:text-paper"
      >
        <Edit3 className="h-4 w-4" />
      </button>

      {acc && (
        <button
          type="button"
          onClick={() => onDisconnectPlatform(plat)}
          title="Délier ce compte"
          aria-label="Délier ce compte"
          className="flex h-8 w-8 items-center justify-center rounded-control text-faint transition hover:bg-edge hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
