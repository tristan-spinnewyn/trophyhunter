// components/library/nav/NavFeatureTabs.tsx

import type { ReactNode } from "react";
import { Copy, Heart, Folder, MonitorPlay } from "lucide-react";
import type { LibraryTab } from "@/lib/library/library-filters";
import type { FeatureTabId } from "./LibraryNavTabs.types";
import { buildFeatureTabItems } from "./navTabsConfig.services";

interface NavFeatureTabsProps {
  readonly activePlatformTab: LibraryTab;
  readonly onSelectTab: (tab: LibraryTab) => void;
  readonly duplicateCount: number;
  readonly wishlistCount: number;
  readonly collectionsCount: number;
}

const FEATURE_ICONS: Record<FeatureTabId, (className: string) => ReactNode> = {
  gamepass: (cls) => <MonitorPlay className={cls} />,
  duplicates: (cls) => <Copy className={cls} />,
  wishlist: (cls) => <Heart className={cls} />,
  collections: (cls) => <Folder className={cls} />,
};

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
    <div className="flex shrink-0 items-center gap-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectTab(item.id)}
          aria-pressed={item.isActive}
          className={`group flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
            item.isActive
              ? item.activeClass
              : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          {FEATURE_ICONS[item.id](`h-3.5 w-3.5 shrink-0 ${item.iconColorClass}`)}
          <span>{item.label}</span>
          {typeof item.count === "number" && item.count > 0 && (
            <span className="text-xs tabular-nums text-slate-500">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
