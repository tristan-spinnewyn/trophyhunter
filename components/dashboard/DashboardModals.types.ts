// components/dashboard/DashboardModals.types.ts

import type { GameSearchResult, OwnedGame, PlatformType } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";

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
  collections: LocalCollection[];
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
