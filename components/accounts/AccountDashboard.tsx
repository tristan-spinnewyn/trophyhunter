// components/accounts/AccountDashboard.tsx

"use client";

import FeedbackToasts from "@/components/ui/FeedbackToasts";
import AccountTabPanel from "@/components/accounts/AccountTabPanel";
import { AccountPlatformTabs } from "@/components/accounts/AccountPlatformTabs";
import { AccountModals } from "@/components/accounts/AccountModals";
import {
  useAccountDashboardController,
  type AccountDashboardControllerParams,
} from "@/components/accounts/hooks/useAccountDashboardController";

export default function AccountDashboard(props: AccountDashboardControllerParams) {
  const c = useAccountDashboardController(props);

  return (
    <div className="space-y-6">
      <FeedbackToasts
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

      <AccountTabPanel controller={c} props={props} />

      <AccountModals controller={c} />
    </div>
  );
}
