// components/dashboard/AccountModals.tsx

import EditPlatformModal from "./EditPlatformModal";
import EpicAuthModal from "@/components/EpicAuthModal";
import type { DashboardSectionProps } from "./hooks/useAccountDashboardController";

/** Dialogs of the accounts page: edit a platform account and authorize Epic Games. */
export function AccountModals({ controller: c }: Pick<DashboardSectionProps, "controller">) {
  const ps = c.platformSync;

  return (
    <>
      <EditPlatformModal
        editingPlatform={ps.editingPlatform}
        onClose={() => ps.setEditingPlatform(null)}
        platForm={ps.platForm}
        setPlatForm={ps.setPlatForm}
        onSave={ps.handleSavePlatformModal}
      />
      <EpicAuthModal
        isOpen={ps.isEpicAuthModalOpen}
        onClose={ps.closeEpicAuthModal}
        onSubmit={ps.handleEpicModalSubmit}
        gameName={ps.epicAuthModalGame?.name}
        isLoading={ps.isEpicModalSyncing}
        error={ps.epicAuthModalError}
      />
    </>
  );
}
