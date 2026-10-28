// components/dashboard/nav/NavPlatformTabs.tsx

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
    <div className="flex flex-wrap items-center gap-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectTab(item.id)}
          className={`group flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
            item.isActive
              ? item.activeClass
              : "border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/90 hover:text-slate-100"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full shrink-0 transition-transform group-hover:scale-110 ${
              item.isConnected
                ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                : "bg-slate-700"
            }`}
            title={item.isConnected ? "Compte lié" : "Compte non lié"}
          />
          <span>{item.label}</span>
          {item.count > 0 && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums transition-colors ${
                item.isActive
                  ? "bg-slate-950/50 text-white"
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
