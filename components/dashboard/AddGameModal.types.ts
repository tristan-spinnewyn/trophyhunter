// components/dashboard/AddGameModal.types.ts

import type { GameSearchResult, OwnedGame, PlatformType } from "@/lib/types";

export interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlatformForAdd: PlatformType;
  setSelectedPlatformForAdd: (plat: PlatformType) => void;
  addGameQuery: string;
  handleSearchAddGame: (val: string) => void;
  isSearchingAdd: boolean;
  addGameResults: GameSearchResult[];
  ownedGames: OwnedGame[];
  handleAddGameToLibrary: (item: GameSearchResult) => void;
  bulkImportText: string;
  setBulkImportText: (val: string) => void;
  handleBulkImport: () => void;
  isBulkImporting: boolean;
}
