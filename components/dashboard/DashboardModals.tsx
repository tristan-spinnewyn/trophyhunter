// components/dashboard/DashboardModals.tsx

"use client";

import EditPlatformModal from "@/components/dashboard/EditPlatformModal";
import AddGameModal from "@/components/dashboard/AddGameModal";
import AddToCollectionModal from "@/components/dashboard/AddToCollectionModal";
import EpicAuthModal from "@/components/EpicAuthModal";
import type { DashboardModalsProps } from "./DashboardModals.types";

export type { DashboardModalsProps };

export default function DashboardModals({
  editingPlatform,
  onCloseEditPlatform,
  platForm,
  setPlatForm,
  onSavePlatformModal,
  isAddGameOpen,
  onCloseAddGame,
  selectedPlatformForAdd,
  setSelectedPlatformForAdd,
  addGameQuery,
  handleSearchAddGame,
  isSearchingAdd,
  addGameResults,
  ownedGames,
  handleAddGameToLibrary,
  bulkImportText,
  setBulkImportText,
  handleBulkImport,
  isBulkImporting,
  gameToAddToColl,
  collections,
  onCloseAddToColl,
  onAddToCollection,
  isEpicAuthModalOpen = false,
  epicAuthModalGame = null,
  epicAuthModalError = null,
  isEpicModalSyncing = false,
  onCloseEpicAuthModal,
  onSubmitEpicAuthModal,
}: DashboardModalsProps) {
  return (
    <>
      {editingPlatform !== undefined &&
        onCloseEditPlatform &&
        platForm &&
        setPlatForm &&
        onSavePlatformModal && (
          <EditPlatformModal
            editingPlatform={editingPlatform}
            onClose={onCloseEditPlatform}
            platForm={platForm}
            setPlatForm={setPlatForm}
            onSave={onSavePlatformModal}
          />
        )}

      <AddGameModal
        isOpen={isAddGameOpen}
        onClose={onCloseAddGame}
        selectedPlatformForAdd={selectedPlatformForAdd}
        setSelectedPlatformForAdd={setSelectedPlatformForAdd}
        addGameQuery={addGameQuery}
        handleSearchAddGame={handleSearchAddGame}
        isSearchingAdd={isSearchingAdd}
        addGameResults={addGameResults}
        ownedGames={ownedGames}
        handleAddGameToLibrary={handleAddGameToLibrary}
        bulkImportText={bulkImportText}
        setBulkImportText={setBulkImportText}
        handleBulkImport={handleBulkImport}
        isBulkImporting={isBulkImporting}
      />

      <AddToCollectionModal
        game={gameToAddToColl}
        collections={collections}
        onClose={onCloseAddToColl}
        onAddToCollection={onAddToCollection}
      />

      {onCloseEpicAuthModal && onSubmitEpicAuthModal && (
        <EpicAuthModal
          isOpen={isEpicAuthModalOpen}
          onClose={onCloseEpicAuthModal}
          onSubmit={onSubmitEpicAuthModal}
          gameName={epicAuthModalGame?.name}
          isLoading={isEpicModalSyncing}
          error={epicAuthModalError}
        />
      )}
    </>
  );
}
