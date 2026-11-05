// components/accounts/AccountPlatformTabs.tsx

import { textTabClassName } from "@/components/ui/textTab";
import type { UserAccountProfile } from "@/lib/types";
import type { AccountTab } from "./hooks/useAccountDashboardController";
import { NavPlatformTabs } from "../library/nav/NavPlatformTabs";

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
      className="-mx-4 flex items-center gap-5 overflow-x-auto scrollbar-none border-b border-edge px-4 sm:mx-0 sm:px-0"
    >
      <button
        type="button"
        onClick={() => onSelectTab("all")}
        aria-pressed={isOverview}
        className={textTabClassName(isOverview)}
      >
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
