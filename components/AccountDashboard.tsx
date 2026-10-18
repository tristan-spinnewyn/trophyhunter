// components/AccountDashboard.tsx

"use client";

import DashboardBanners from "@/components/dashboard/DashboardBanners";
import DashboardNavTabs from "@/components/dashboard/DashboardNavTabs";
import { DashboardActiveTabSection } from "@/components/dashboard/DashboardActiveTabSection";
import { DashboardLibraryView } from "@/components/dashboard/DashboardLibraryView";
import { DashboardModalsContainer } from "@/components/dashboard/DashboardModalsContainer";
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

      <DashboardNavTabs
        activePlatformTab={c.activePlatformTab}
        onSelectTab={c.handleSelectTab}
        ownedGamesCount={props.ownedGames.length}
        platformCounts={c.stats.platformCounts}
        accountProfile={props.accountProfile}
        duplicateCount={c.stats.duplicateGroups.length}
        wishlistCount={c.collectionsState.wishlistIds.length}
        collectionsCount={c.collectionsState.collections.length}
      />

      <DashboardActiveTabSection
        controller={c}
        props={props}
      />

      <DashboardLibraryView
        controller={c}
        props={props}
      />

      <DashboardModalsContainer
        controller={c}
        props={props}
      />
    </div>
  );
}
