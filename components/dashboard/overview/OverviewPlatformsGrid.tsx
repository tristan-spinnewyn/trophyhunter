// components/dashboard/overview/OverviewPlatformsGrid.tsx

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
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Mes plateformes</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
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
    </section>
  );
}
