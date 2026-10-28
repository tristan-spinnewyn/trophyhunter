// components/AccountDashboard.tsx

"use client";

import DashboardBanners from "@/components/dashboard/DashboardBanners";
import ActiveTabPanel from "@/components/dashboard/ActiveTabPanel";
import { AccountPlatformTabs } from "@/components/dashboard/AccountPlatformTabs";
import { AccountModals } from "@/components/dashboard/AccountModals";
import {
  useAccountDashboardController,
  type AccountDashboardControllerParams,
} from "@/components/dashboard/hooks/useAccountDashboardController";

export default function AccountDashboard(props: AccountDashboardControllerParams) {
  const c = useAccountDashboardController(props);

  return (
    <div className="space-y-6">
      <DashboardBanners
        bannerMsg={c.bannerMsg}
        onDismissBanner={() => c.setBannerMsg(null)}
        syncProgressText={c.platformSync.syncProgressText}
      />

      <AccountPlatformTabs
        activeTab={c.activePlatformTab}
        onSelectTab={c.handleSelectTab}
        platformCounts={c.stats.platformCounts}
        accountProfile={props.accountProfile}
      />

      <ActiveTabPanel controller={c} props={props} />

      <AccountModals controller={c} />
    </div>
  );
}
