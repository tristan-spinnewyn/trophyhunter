// components/accounts/overview/PlatformCard.tsx

import { Check } from "lucide-react";
import type { PlatformType, PlatformAccount } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import { PlatformCardStats } from "./PlatformCardStats";
import { PlatformCardActions } from "./PlatformCardActions";

interface PlatformCardProps {
  platform: PlatformType;
  account?: PlatformAccount;
  count: number;
  onSelectPlatform: (platform: PlatformType) => void;
  onEditPlatform: (platform: PlatformType) => void;
  onDisconnectPlatform: (platform: PlatformType) => void;
}

export function PlatformCard({
  platform: plat,
  account: acc,
  count,
  onSelectPlatform,
  onEditPlatform,
  onDisconnectPlatform,
}: PlatformCardProps) {
  const meta = PLATFORM_META[plat];

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border p-3.5 ${
        acc ? "border-slate-800 bg-slate-900/60" : "border-dashed border-slate-800"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium ${meta.badgeClass}`}
          >
            {meta.shortName}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-xs tabular-nums text-slate-500">
              {count} {count > 1 ? "jeux" : "jeu"}
            </span>
            {acc ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                <Check className="h-3.5 w-3.5" /> Lié
              </span>
            ) : (
              <span className="text-xs text-slate-500">Non lié</span>
            )}
          </div>
        </div>

        {acc ? (
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="truncate text-sm font-semibold text-white">
                {acc.displayName}
              </div>
              {acc.level ? (
                <span className="text-xs font-medium tabular-nums text-amber-400">
                  Niv. {acc.level}
                </span>
              ) : null}
            </div>

            <PlatformCardStats account={acc} meta={meta} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            Lie ton compte {meta.name} pour importer tes jeux et tes succès.
          </p>
        )}
      </div>

      <PlatformCardActions
        platform={plat}
        account={acc}
        onSelectPlatform={onSelectPlatform}
        onEditPlatform={onEditPlatform}
        onDisconnectPlatform={onDisconnectPlatform}
      />
    </div>
  );
}
