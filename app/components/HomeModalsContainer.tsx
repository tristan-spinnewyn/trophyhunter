// app/components/HomeModalsContainer.tsx

import DashboardModals from "@/components/dashboard/DashboardModals";

interface HomeModalsContainerProps {
  controller: any;
}

export function HomeModalsContainer({ controller: c }: HomeModalsContainerProps) {
  const { collectionsState: cs, addGameFlow: ag, bulkImport: bi } = c;

  return (
    <DashboardModals
      isAddGameOpen={ag.isAddGameOpen}
      onCloseAddGame={() => ag.setIsAddGameOpen(false)}
      selectedPlatformForAdd={ag.selectedPlatformForAdd}
      setSelectedPlatformForAdd={ag.setSelectedPlatformForAdd}
      addGameQuery={ag.addGameQuery}
      handleSearchAddGame={ag.handleSearchAddGame}
      isSearchingAdd={ag.isSearchingAdd}
      addGameResults={ag.addGameResults}
      ownedGames={c.ownedGames}
      handleAddGameToLibrary={ag.handleAddGameToLibrary}
      bulkImportText={bi.bulkImportText}
      setBulkImportText={bi.setBulkImportText}
      handleBulkImport={bi.handleBulkImport}
      isBulkImporting={bi.isBulkImporting}
      gameToAddToColl={cs.gameToAddToColl}
      collections={cs.collections}
      onCloseAddToColl={() => cs.setGameToAddToColl(null)}
      onAddToCollection={cs.handleAddGameToColl}
    />
  );
}
