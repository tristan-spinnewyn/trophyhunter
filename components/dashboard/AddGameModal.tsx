"use client";

import { Plus, Search, Loader2, Upload } from "lucide-react";
import type { GameSearchResult, OwnedGame, PlatformType } from "@/lib/types";
import { ALL_PLATFORMS, PLATFORM_META } from "@/lib/storage";

interface AddGameModalProps {
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
          {/* Platform selector for added game */}
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

          {/* Instant search & add */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              2. Chercher et ajouter un jeu en 1 clic :
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={addGameQuery}
                onChange={(e) => handleSearchAddGame(e.target.value)}
                placeholder="Ex: Elden Ring, God of War, Hades..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-sky-500"
              />
            </div>

            {isSearchingAdd && (
              <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
                Recherche en cours...
              </div>
            )}

            {addGameResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-slate-800 bg-slate-950 p-1.5">
                {addGameResults.map((item) => {
                  const alreadyOwned = ownedGames.some(
                    (g) =>
                      g.appId === item.id &&
                      g.platform === selectedPlatformForAdd
                  );
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-lg p-1.5 hover:bg-slate-900"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.img}
                          alt={item.name}
                          className="h-8 w-14 rounded object-cover bg-slate-800 shrink-0"
                        />
                        <span className="truncate text-xs font-medium text-white">
                          {item.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddGameToLibrary(item)}
                        disabled={alreadyOwned}
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                          alreadyOwned
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-sky-500 text-slate-950 hover:bg-sky-400"
                        }`}
                      >
                        {alreadyOwned ? "✓ Possédé" : "+ Ajouter"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bulk Import without API Key */}
          <div className="border-t border-slate-800 pt-3 space-y-2">
            <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Import massif Steam (AppIDs ou code source de votre page Jeux)
            </label>
            <p className="text-[11px] text-slate-400">
              Vous pouvez coller une liste d&apos;AppIDs Steam (ex:{" "}
              <code>1091500, 1245620, 367520</code>) ou le code source de
              votre page{" "}
              <code>steamcommunity.com/my/games/?tab=all</code> pour
              importer tous vos jeux d&apos;un coup sans clé API !
            </p>
            <textarea
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
              rows={3}
              placeholder="Collez ici des AppIDs, URLs Steam ou le code HTML de votre page de jeux..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 font-mono outline-none focus:border-sky-500"
            />
            <button
              onClick={handleBulkImport}
              disabled={!bulkImportText.trim() || isBulkImporting}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40"
            >
              {isBulkImporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Importer dans ma bibliothèque
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
