// components/library/LibraryNavTabs.tsx

import { Layers } from "lucide-react";
import type { LibraryTab } from "@/lib/library/library-filters";
import type { LibraryNavTabsProps } from "./nav/LibraryNavTabs.types";
import { NavPlatformTabs } from "./nav/NavPlatformTabs";
import { NavFeatureTabs } from "./nav/NavFeatureTabs";

export type { LibraryNavTabsProps };

export default function LibraryNavTabs({
  activePlatformTab,
  onSelectTab,
  ownedGamesCount,
  platformCounts,
  accountProfile,
  duplicateCount,
  wishlistCount,
  collectionsCount,
}: LibraryNavTabsProps) {
  const isAllActive = activePlatformTab === "all";

  return (
    <nav
      aria-label="Navigation de la bibliothèque"
      className="-mx-4 flex items-center gap-1 overflow-x-auto scrollbar-none px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onSelectTab("all")}
          aria-pressed={isAllActive}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
            isAllActive
              ? "border-slate-700 bg-slate-800 text-white"
              : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span>Tous</span>
          <span className="text-xs tabular-nums text-slate-500">
            {ownedGamesCount}
          </span>
        </button>

        

        <NavPlatformTabs
          activePlatformTab={activePlatformTab}
          onSelectTab={onSelectTab}
          platformCounts={platformCounts}
          accountProfile={accountProfile}
        />
      </div>

      <div aria-hidden className="mx-1 h-5 w-px shrink-0 bg-slate-800" />

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
