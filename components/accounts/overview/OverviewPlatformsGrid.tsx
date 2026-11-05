// components/accounts/overview/OverviewPlatformsGrid.tsx

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
  const largestCount = Math.max(0, ...ALL_PLATFORMS.map((p) => platformCounts[p] || 0));

  return (
    <section>
      <h2 className="sr-only">Mes plateformes</h2>

      <ul className="border-t border-edge">
        {ALL_PLATFORMS.map((plat) => (
          <PlatformCard
            key={plat}
            platform={plat}
            account={accountProfile.accounts[plat]}
            count={platformCounts[plat] || 0}
            largestCount={largestCount}
            onSelectPlatform={onSelectPlatform}
            onEditPlatform={onEditPlatform}
            onDisconnectPlatform={onDisconnectPlatform}
          />
        ))}
      </ul>
    </section>
  );
}
