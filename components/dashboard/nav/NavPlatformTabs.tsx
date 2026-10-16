// components/dashboard/nav/NavPlatformTabs.tsx

import type { UserAccountProfile, PlatformType } from "@/lib/types";
import { ALL_PLATFORMS, PLATFORM_META } from "@/lib/storage";
import type { DashboardTabType } from "./DashboardNavTabs.types";

interface NavPlatformTabsProps {
  activePlatformTab: DashboardTabType;
  onSelectTab: (tab: DashboardTabType) => void;
  platformCounts: Record<string, number>;
  accountProfile: UserAccountProfile;
}

export function NavPlatformTabs({
  activePlatformTab,
  onSelectTab,
  platformCounts,
  accountProfile,
}: NavPlatformTabsProps) {
  return (
    <>
      {ALL_PLATFORMS.map((plat) => {
        const meta = PLATFORM_META[plat];
        const count = platformCounts[plat] || 0;
        const isConnected = !!accountProfile.accounts[plat];
        const isActive = activePlatformTab === plat;

        return (
          <button
            key={plat}
            onClick={() => onSelectTab(plat)}
            className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 font-bold whitespace-nowrap transition shrink-0 ${
              isActive
                ? `${meta.badgeClass} ring-2 ring-current/40 shadow-lg`
                : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
            }`}
          >
            <span>{meta.shortName}</span>
            {count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isActive
                    ? "bg-black/30 font-black"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {count}
              </span>
            )}
            {isConnected && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"
                title="Compte lié"
              />
            )}
          </button>
        );
      })}
    </>
  );
}
