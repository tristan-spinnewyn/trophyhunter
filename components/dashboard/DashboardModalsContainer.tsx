// components/dashboard/DashboardModalsContainer.tsx

import DashboardModals from "./DashboardModals";
import type { AccountDashboardControllerParams } from "./hooks/useAccountDashboardController";

interface DashboardModalsContainerProps {
  controller: any;
  props: AccountDashboardControllerParams;
}

export function DashboardModalsContainer({
  controller: c,
  props,
}: DashboardModalsContainerProps) {
  const { collectionsState: cs, platformSync: ps, addGameFlow: ag, bulkImport: bi } = c;

  return (
    <DashboardModals
      editingPlatform={ps.editingPlatform}
      onCloseEditPlatform={() => ps.setEditingPlatform(null)}
      platForm={ps.platForm}
      setPlatForm={ps.setPlatForm}
      onSavePlatformModal={ps.handleSavePlatformModal}
      isAddGameOpen={ag.isAddGameOpen}
      onCloseAddGame={() => ag.setIsAddGameOpen(false)}
      selectedPlatformForAdd={ag.selectedPlatformForAdd}
      setSelectedPlatformForAdd={ag.setSelectedPlatformForAdd}
      addGameQuery={ag.addGameQuery}
      handleSearchAddGame={ag.handleSearchAddGame}
      isSearchingAdd={ag.isSearchingAdd}
      addGameResults={ag.addGameResults}
      ownedGames={props.ownedGames}
      handleAddGameToLibrary={ag.handleAddGameToLibrary}
      bulkImportText={bi.bulkImportText}
      setBulkImportText={bi.setBulkImportText}
      handleBulkImport={bi.handleBulkImport}
      isBulkImporting={bi.isBulkImporting}
      gameToAddToColl={cs.gameToAddToColl}
      collections={cs.collections}
      onCloseAddToColl={() => cs.setGameToAddToColl(null)}
      onAddToCollection={cs.handleAddGameToColl}
      isEpicAuthModalOpen={ps.isEpicAuthModalOpen}
      epicAuthModalGame={ps.epicAuthModalGame}
      epicAuthModalError={ps.epicAuthModalError}
      isEpicModalSyncing={ps.isEpicModalSyncing}
      onCloseEpicAuthModal={ps.closeEpicAuthModal}
      onSubmitEpicAuthModal={ps.handleEpicModalSubmit}
    />
  );
}
