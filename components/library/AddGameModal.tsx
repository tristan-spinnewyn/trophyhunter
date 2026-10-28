// components/library/AddGameModal.tsx

"use client";
import { Plus } from "lucide-react";
import { ALL_PLATFORMS, PLATFORM_META } from "@/lib/platforms";
import { AddGameSearchSection } from "./add-game/AddGameSearchSection";
import { AddGameBulkImportSection } from "./add-game/AddGameBulkImportSection";
import type { GameSearchResult, OwnedGame, PlatformType } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

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


export default function AddGameModal({
  isOpen,
  onClose,
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
}: AddGameModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      title="Ajouter des jeux"
      icon={<Plus className="h-4 w-4 text-sky-400" />}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-300">Plateforme</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {ALL_PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPlatformForAdd(p)}
                aria-pressed={selectedPlatformForAdd === p}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  selectedPlatformForAdd === p
                    ? PLATFORM_META[p].badgeClass
                    : "border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {PLATFORM_META[p].shortName}
              </button>
            ))}
          </div>
        </div>

        <AddGameSearchSection
          selectedPlatformForAdd={selectedPlatformForAdd}
          addGameQuery={addGameQuery}
          handleSearchAddGame={handleSearchAddGame}
          isSearchingAdd={isSearchingAdd}
          addGameResults={addGameResults}
          ownedGames={ownedGames}
          handleAddGameToLibrary={handleAddGameToLibrary}
        />

        <AddGameBulkImportSection
          bulkImportText={bulkImportText}
          setBulkImportText={setBulkImportText}
          handleBulkImport={handleBulkImport}
          isBulkImporting={isBulkImporting}
        />
      </div>
    </Modal>
  );
}
