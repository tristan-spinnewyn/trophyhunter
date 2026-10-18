// components/dashboard/nav/NavFeatureTabs.tsx

import type { ReactNode } from "react";
import { Copy, Heart, Folder, MonitorPlay } from "lucide-react";
import type { DashboardTabType, FeatureTabId } from "./DashboardNavTabs.types";
import { buildFeatureTabItems } from "./navTabsConfig.services";

interface NavFeatureTabsProps {
  readonly activePlatformTab: DashboardTabType;
  readonly onSelectTab: (tab: DashboardTabType) => void;
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
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectTab(item.id)}
          className={`group flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
            item.isActive
              ? item.activeClass
              : "border-slate-800/80 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900 hover:text-white"
          }`}
        >
          {FEATURE_ICONS[item.id](`h-3.5 w-3.5 shrink-0 ${item.iconColorClass}`)}
          <span>{item.label}</span>
          {typeof item.count === "number" && item.count > 0 && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                item.isActive
                  ? item.activeBadgeClass
                  : "bg-slate-800/90 text-slate-400 group-hover:text-slate-200"
              }`}
            >
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
