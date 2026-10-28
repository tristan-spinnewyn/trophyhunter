// components/dashboard/DashboardModals.tsx

"use client";
import EditPlatformModal from "@/components/dashboard/EditPlatformModal";
import AddGameModal from "@/components/dashboard/AddGameModal";
import AddToCollectionModal from "@/components/dashboard/AddToCollectionModal";
import EpicAuthModal from "@/components/EpicAuthModal";
import type { GameSearchResult, OwnedGame, PlatformType, CollectionWithGames } from "@/lib/types";

export interface DashboardModalsProps {
  // Edit Platform Modal (Optional)
  editingPlatform?: PlatformType | null;
  onCloseEditPlatform?: () => void;
  platForm?: any;
  setPlatForm?: (val: any) => void;
  onSavePlatformModal?: () => void;

  // Add Game Modal
  isAddGameOpen: boolean;
  onCloseAddGame: () => void;
  selectedPlatformForAdd: PlatformType;
  setSelectedPlatformForAdd: (p: PlatformType) => void;
  addGameQuery: string;
  handleSearchAddGame: (query: string) => void;
  isSearchingAdd: boolean;
  addGameResults: GameSearchResult[];
  ownedGames: OwnedGame[];
  handleAddGameToLibrary: (item: GameSearchResult) => void;
  bulkImportText: string;
  setBulkImportText: (t: string) => void;
  handleBulkImport: () => void;
  isBulkImporting: boolean;

  // Add to Collection Modal
  gameToAddToColl: OwnedGame | null;
  collections: CollectionWithGames[];
  onCloseAddToColl: () => void;
  onAddToCollection: (collId: string, game: OwnedGame) => void;

  // Epic Auth Modal (Optional)
  isEpicAuthModalOpen?: boolean;
  epicAuthModalGame?: OwnedGame | null;
  epicAuthModalError?: string | null;
  isEpicModalSyncing?: boolean;
  onCloseEpicAuthModal?: () => void;
  onSubmitEpicAuthModal?: (token: string) => Promise<void> | void;
}


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
