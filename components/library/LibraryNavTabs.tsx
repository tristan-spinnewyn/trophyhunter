// components/library/LibraryNavTabs.tsx

import { textTabClassName } from "@/components/ui/textTab";
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
      className="-mx-4 flex items-center gap-5 overflow-x-auto scrollbar-none border-b border-edge px-4 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      <div className="flex shrink-0 items-center gap-5">
        <button
          type="button"
          onClick={() => onSelectTab("all")}
          aria-pressed={isAllActive}
          className={textTabClassName(isAllActive)}
        >
                    <span>Tous</span>
          <span className="text-xs tabular-nums text-faint">
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

      <div aria-hidden className="h-5 w-px shrink-0 bg-edge" />

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
