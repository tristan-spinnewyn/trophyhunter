// components/library/nav/NavPlatformTabs.tsx

import type { UserAccountProfile } from "@/lib/types";
import type { LibraryTab } from "@/lib/library/library-filters";
import { buildPlatformTabItems } from "./navTabsConfig.services";

interface NavPlatformTabsProps {
  readonly activePlatformTab: LibraryTab;
  readonly onSelectTab: (tab: LibraryTab) => void;
  readonly platformCounts: Record<string, number>;
  readonly accountProfile: UserAccountProfile;
}

export function NavPlatformTabs({
  activePlatformTab,
  onSelectTab,
  platformCounts,
  accountProfile,
}: NavPlatformTabsProps) {
  const items = buildPlatformTabItems(activePlatformTab, platformCounts, accountProfile);

  return (
    <div className="flex shrink-0 items-center gap-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectTab(item.id)}
          aria-pressed={item.isActive}
          className={`group flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
            item.isActive
              ? item.activeClass
              : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full shrink-0 transition-transform group-hover:scale-110 ${
              item.isConnected
                ? "bg-emerald-400"
                : "bg-slate-700"
            }`}
            title={item.isConnected ? "Compte lié" : "Compte non lié"}
          />
          <span>{item.label}</span>
          {item.count > 0 && (
            <span className="text-xs tabular-nums text-slate-500">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
