// components/dashboard/overview/OverviewPlatformsGrid.tsx

import { Layers } from "lucide-react";
import type { UserAccountProfile, PlatformType } from "@/lib/types";
import { ALL_PLATFORMS } from "@/lib/platforms";
import { PlatformCard } from "./PlatformCard";

interface OverviewPlatformsGridProps {
  accountProfile: UserAccountProfile;
  platformCounts: Record<string, number>;
  onSelectPlatform: (platform: PlatformType) => void;
  onEditPlatform: (platform: PlatformType) => void;
  onDisconnectPlatform: (platform: PlatformType) => void;
}

export function OverviewPlatformsGrid({
  accountProfile,
  platformCounts,
  onSelectPlatform,
  onEditPlatform,
  onDisconnectPlatform,
}: OverviewPlatformsGridProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            Mes Plateformes de Jeu ({ALL_PLATFORMS.length})
          </h3>
          <p className="text-xs text-slate-400">
            Cliquez sur un espace pour accéder à sa vue dédiée (Steam, Xbox, Epic Games, GOG...).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {ALL_PLATFORMS.map((plat) => (
          <PlatformCard
            key={plat}
            platform={plat}
            account={accountProfile.accounts[plat]}
            count={platformCounts[plat] || 0}
            onSelectPlatform={onSelectPlatform}
            onEditPlatform={onEditPlatform}
            onDisconnectPlatform={onDisconnectPlatform}
          />
        ))}
      </div>
    </div>
  );
}
