// components/library/nav/NavFeatureTabs.tsx

import { textTabClassName } from "@/components/ui/textTab";
import type { LibraryTab } from "@/lib/library/library-filters";
import { buildFeatureTabItems } from "./navTabsConfig.services";

interface NavFeatureTabsProps {
  readonly activePlatformTab: LibraryTab;
  readonly onSelectTab: (tab: LibraryTab) => void;
  readonly duplicateCount: number;
  readonly wishlistCount: number;
  readonly collectionsCount: number;
}

export function NavFeatureTabs({
  activePlatformTab,
  onSelectTab,
  duplicateCount,
  wishlistCount,
  collectionsCount,
}: NavFeatureTabsProps) {
  const items = buildFeatureTabItems(activePlatformTab, {
    duplicateCount,
    wishlistCount,
    collectionsCount,
  });

  return (
    <div className="flex shrink-0 items-center gap-5">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectTab(item.id)}
          aria-pressed={item.isActive}
          className={textTabClassName(item.isActive)}
        >
                    <span>{item.label}</span>
          {typeof item.count === "number" && item.count > 0 && (
            <span className="text-xs tabular-nums text-faint">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
