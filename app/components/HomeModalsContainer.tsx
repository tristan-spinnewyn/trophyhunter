// app/components/HomeModalsContainer.tsx

import AddGameModal from "@/components/library/AddGameModal";
import AddToCollectionModal from "@/components/library/AddToCollectionModal";
import EpicAuthModal from "@/components/EpicAuthModal";
import type { useHomePageController } from "../hooks/useHomePageController";

interface HomeModalsContainerProps {
  readonly controller: ReturnType<typeof useHomePageController>;
}

/** Dialogs of the collection page: add games, file a game in a collection, authorize an Epic sync. */
export function HomeModalsContainer({ controller: c }: HomeModalsContainerProps) {
  const { collectionsState: cs, addGameFlow: ag, bulkImport: bi, platformSync: ps } = c;

  return (
    <>
      <AddGameModal
        isOpen={ag.isAddGameOpen}
        onClose={() => ag.setIsAddGameOpen(false)}
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
      />
      <AddToCollectionModal
        game={cs.gameToAddToColl}
        collections={cs.collections}
        onClose={() => cs.setGameToAddToColl(null)}
        onAddToCollection={cs.handleAddGameToColl}
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
