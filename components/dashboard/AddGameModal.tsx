// components/dashboard/AddGameModal.tsx

"use client";
import { Plus } from "lucide-react";
import { ALL_PLATFORMS, PLATFORM_META } from "@/lib/platforms";
import { AddGameSearchSection } from "./add-game/AddGameSearchSection";
import { AddGameBulkImportSection } from "./add-game/AddGameBulkImportSection";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-sky-400" />
            Ajouter des jeux possédés à ma bibliothèque
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-semibold text-slate-300">
              1. Choisir la plateforme du jeu :
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ALL_PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlatformForAdd(p)}
                  className={`rounded-xl border px-2.5 py-1 text-xs font-semibold transition ${
                    selectedPlatformForAdd === p
                      ? PLATFORM_META[p].badgeClass
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
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
      </div>
    </div>
  );
}
