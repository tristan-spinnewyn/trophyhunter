// components/dashboard/AccountPlatformTabs.tsx

import { LayoutGrid } from "lucide-react";
import type { UserAccountProfile } from "@/lib/types";
import type { AccountTab } from "./hooks/useAccountDashboardController";
import { NavPlatformTabs } from "./nav/NavPlatformTabs";

interface AccountPlatformTabsProps {
  readonly activeTab: AccountTab;
  readonly onSelectTab: (tab: AccountTab) => void;
  readonly platformCounts: Record<string, number>;
  readonly accountProfile: UserAccountProfile;
}

export function AccountPlatformTabs({
  activeTab,
  onSelectTab,
  platformCounts,
  accountProfile,
}: AccountPlatformTabsProps) {
  const isOverview = activeTab === "all";

  return (
    <nav
      aria-label="Plateformes"
      className="-mx-4 flex items-center gap-1 overflow-x-auto scrollbar-none px-4 sm:mx-0 sm:px-0"
    >
      <button
        type="button"
        onClick={() => onSelectTab("all")}
        aria-pressed={isOverview}
        className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
          isOverview
            ? "border-slate-700 bg-slate-800 text-white"
            : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-white"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Vue d&apos;ensemble
      </button>

      <NavPlatformTabs
        activePlatformTab={activeTab}
        onSelectTab={(tab) => onSelectTab(tab as AccountTab)}
        platformCounts={platformCounts}
        accountProfile={accountProfile}
      />
    </nav>
  );
}
