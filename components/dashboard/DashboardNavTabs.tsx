// components/dashboard/DashboardNavTabs.tsx

import { Layers } from "lucide-react";
import type { DashboardTabType, DashboardNavTabsProps } from "./nav/DashboardNavTabs.types";
import { NavPlatformTabs } from "./nav/NavPlatformTabs";
import { NavFeatureTabs } from "./nav/NavFeatureTabs";
import { NavSqliteBadge } from "./nav/NavSqliteBadge";

export type { DashboardTabType, DashboardNavTabsProps };

export default function DashboardNavTabs({
  activePlatformTab,
  onSelectTab,
  ownedGamesCount,
  platformCounts,
  accountProfile,
  duplicateCount,
  wishlistCount,
  collectionsCount,
  currentUser,
  onOpenAuthModal,
}: DashboardNavTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
      {/* Global Overview Tab */}
      <button
        onClick={() => onSelectTab("all")}
        className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 font-bold whitespace-nowrap transition shrink-0 ${
          activePlatformTab === "all"
            ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
            : "border border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:text-white"
        }`}
      >
        <Layers className="h-3.5 w-3.5" />
        <span>Vue Globale</span>
        <span
          className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
            activePlatformTab === "all"
              ? "bg-slate-950/30 text-slate-950 font-black"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          {ownedGamesCount}
        </span>
      </button>

      <NavPlatformTabs
        activePlatformTab={activePlatformTab}
        onSelectTab={onSelectTab}
        platformCounts={platformCounts}
        accountProfile={accountProfile}
      />

      <NavFeatureTabs
        activePlatformTab={activePlatformTab}
        onSelectTab={onSelectTab}
        duplicateCount={duplicateCount}
        wishlistCount={wishlistCount}
        collectionsCount={collectionsCount}
      />

      <NavSqliteBadge
        currentUser={currentUser}
        onOpenAuthModal={onOpenAuthModal}
      />
    </div>
  );
}
