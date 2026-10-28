// components/accounts/AccountTabPanel.tsx

import OverviewPanel from "@/components/accounts/OverviewPanel";
import type { DashboardSectionProps } from "./hooks/useAccountDashboardController";
import { PlatformTabSwitcher } from "./active-tab/PlatformTabSwitcher";

export default function AccountTabPanel({ controller: c, props }: DashboardSectionProps) {
  if (c.activePlatformTab === "all") {
    return (
      <OverviewPanel
        accountProfile={props.accountProfile}
        platformCounts={c.stats.platformCounts}
        onSelectPlatform={c.handleSelectTab}
        onEditPlatform={c.platformSync.openEditPlatform}
        onDisconnectPlatform={c.platformSync.handleDisconnectPlatform}
        onSelectGame={props.onSelectGame}
      />
    );
  }

  return <PlatformTabSwitcher controller={c} props={props} />;
}
