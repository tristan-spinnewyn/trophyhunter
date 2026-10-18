// components/dashboard/DashboardNavTabs.tsx

import { Layers } from "lucide-react";
import type { DashboardTabType, DashboardNavTabsProps } from "./nav/DashboardNavTabs.types";
import { NavPlatformTabs } from "./nav/NavPlatformTabs";
import { NavFeatureTabs } from "./nav/NavFeatureTabs";

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
}: DashboardNavTabsProps) {
  const isAllActive = activePlatformTab === "all";

  return (
    <nav
      aria-label="Navigation de la bibliothèque"
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 rounded-2xl border border-slate-800/80 bg-slate-900/75 p-2 backdrop-blur-xl shadow-lg"
    >
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-800/60 bg-slate-950/70 p-1">
        <button
          type="button"
          onClick={() => onSelectTab("all")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-150 ${
            isAllActive
              ? "bg-gradient-to-r from-sky-500 to-sky-400 text-slate-950 shadow-md shadow-sky-500/20"
              : "text-slate-300 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span>Vue Globale</span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
              isAllActive
                ? "bg-slate-950/25 text-slate-950"
                : "bg-slate-800/90 text-slate-400"
            }`}
          >
            {ownedGamesCount}
          </span>
        </button>

        <div className="hidden sm:block h-4 w-px bg-slate-800/80 mx-0.5" />

        <NavPlatformTabs
          activePlatformTab={activePlatformTab}
          onSelectTab={onSelectTab}
          platformCounts={platformCounts}
          accountProfile={accountProfile}
        />
      </div>

      <NavFeatureTabs
        activePlatformTab={activePlatformTab}
        onSelectTab={onSelectTab}
        duplicateCount={duplicateCount}
        wishlistCount={wishlistCount}
        collectionsCount={collectionsCount}
      />
    </nav>
  );
}
