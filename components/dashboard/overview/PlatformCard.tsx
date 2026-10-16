// components/dashboard/overview/PlatformCard.tsx

import { Check } from "lucide-react";
import type { PlatformType, PlatformAccount } from "@/lib/types";
import { PLATFORM_META } from "@/lib/storage";
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
      className={`flex flex-col justify-between rounded-2xl border p-3.5 transition ${
        acc
          ? "border-slate-700 bg-slate-950/80 shadow-md"
          : "border-slate-800/80 bg-slate-950/30 opacity-85 hover:opacity-100"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-bold ${meta.badgeClass}`}
          >
            {meta.shortName}
          </span>

          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
              {count} jeu(x)
            </span>
            {acc ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <Check className="h-3 w-3" /> Lié
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">Non lié</span>
            )}
          </div>
        </div>

        {acc ? (
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="truncate text-sm font-bold text-white">
                {acc.displayName}
              </div>
              {acc.level ? (
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                  Niv. {acc.level}
                </span>
              ) : null}
            </div>

            <PlatformCardStats account={acc} meta={meta} />
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-400">
            Accédez à l&apos;espace {meta.name} pour configurer vos identifiants et voir vos succès.
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
