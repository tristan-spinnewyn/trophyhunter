import {
  Gamepad2,
  Plus,
  Sparkles,
  Search,
  RefreshCw,
} from "lucide-react";
import type {
  OwnedGame,
  PlatformType,
  UserAccountProfile,
} from "@/lib/types";
import {
  ALL_PLATFORMS,
  PLATFORM_META,
  type LocalCollection,
} from "@/lib/storage";
import LibraryGameCard from "@/components/dashboard/LibraryGameCard";
import type { DashboardTabType } from "@/components/dashboard/DashboardNavTabs";
import type {
  StatusFilterType,
  AchievementFilterType,
  SortOrderType,
} from "@/components/dashboard/hooks/useLibraryFilters";

interface LibrarySectionProps {
  activePlatformTab: DashboardTabType;
  filteredGames: OwnedGame[];
  totalOwnedGamesCount: number;
  platformGameCount: number;
  steamAccount?: UserAccountProfile["accounts"]["steam"];
  onOpenAddGame: () => void;
  onAddApiKeyClick: () => void;
  // Filters
  libSearch: string;
  setLibSearch: (val: string) => void;
  libPlatformFilter: PlatformType | "all";
  setLibPlatformFilter: (val: PlatformType | "all") => void;
  libStatusFilter: StatusFilterType;
  setLibStatusFilter: (val: StatusFilterType) => void;
  libAchievementFilter: AchievementFilterType;
  setLibAchievementFilter: (val: AchievementFilterType) => void;
  libSortOrder: SortOrderType;
  setLibSortOrder: (val: SortOrderType) => void;
  // Card Actions & State
  selectedCollId: string | null;
  wishlistIds: number[];
  collections: LocalCollection[];
  onSelectGame: (appId: number) => void;
  onToggleWishlist: (appId: number, platform: PlatformType) => void;
  onOpenAddToCollection: (game: OwnedGame) => void;
  onRemoveFromCollection: (
    collId: string,
    appId: number,
    platform: PlatformType
  ) => void;
  onSyncGame: (game: OwnedGame) => Promise<void>;
  onRemoveGame: (appId: number, platform: PlatformType) => Promise<void>;
  onConnectAndSyncSteam: () => Promise<void>;
  isSyncingSteam: boolean;
}

export default function LibrarySection({
  activePlatformTab,
  filteredGames,
  totalOwnedGamesCount,
  platformGameCount,
  steamAccount,
  onOpenAddGame,
  onAddApiKeyClick,
  libSearch,
  setLibSearch,
  libPlatformFilter,
  setLibPlatformFilter,
  libStatusFilter,
  setLibStatusFilter,
  libAchievementFilter,
  setLibAchievementFilter,
  libSortOrder,
  setLibSortOrder,
  selectedCollId,
  wishlistIds,
  collections,
  onSelectGame,
  onToggleWishlist,
  onOpenAddToCollection,
  onRemoveFromCollection,
  onSyncGame,
  onRemoveGame,
  onConnectAndSyncSteam,
  isSyncingSteam,
}: LibrarySectionProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-sky-400" />
            {activePlatformTab === "all"
              ? `Mes Jeux Possédés (${filteredGames.length}${
                  totalOwnedGamesCount !== filteredGames.length
                    ? ` / ${totalOwnedGamesCount}`
                    : ""
                })`
              : activePlatformTab === "wishlist"
              ? `Ma Liste d'envies (${filteredGames.length})`
              : activePlatformTab === "collections"
              ? `Jeux de la collection (${filteredGames.length})`
              : activePlatformTab === "duplicates"
              ? `Tous les jeux détectés en doublons (${filteredGames.length})`
              : `Mes Jeux ${PLATFORM_META[activePlatformTab].name} (${
                  filteredGames.length
                }${
                  platformGameCount !== filteredGames.length
                    ? ` / ${platformGameCount}`
                    : ""
                })`}
          </h3>
          <p className="text-xs text-slate-400">
            Cliquez sur un jeu pour consulter sa checklist de succès en français et
            ses guides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddGame}
            className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-2 text-xs font-bold text-slate-950 shadow-md shadow-sky-500/20 transition hover:bg-sky-400"
          >
            <Plus className="h-4 w-4" />
            Ajouter / Importer des jeux
          </button>
        </div>
      </div>

      {/* Informative banner if Steam profile has more games than discovered */}
      {steamAccount &&
        steamAccount.stats.gamesOwned > totalOwnedGamesCount &&
        activePlatformTab !== "epic" &&
        activePlatformTab !== "xbox" &&
        activePlatformTab !== "gog" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-sky-500/30 bg-sky-950/30 p-3.5 text-xs">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-sky-200">
                  Steam indique que vous possédez {steamAccount.stats.gamesOwned}{" "}
                  jeux ({totalOwnedGamesCount} jeux publics synchronisés).
                </p>
                <p className="text-[11px] text-slate-400">
                  Valve restreint la liste complète des jeux possédés aux requêtes
                  authentifiées. Pour importer l&apos;ensemble de vos{" "}
                  {steamAccount.stats.gamesOwned} jeux d&apos;un coup, ajoutez votre
                  clé API Steam gratuite ci-dessus ou collez-les via l&apos;import
                  en masse.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onAddApiKeyClick}
                className="rounded-xl border border-sky-500/40 bg-sky-500/20 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30 transition"
              >
                Ajouter clé API
              </button>
              <button
                onClick={onOpenAddGame}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
              >
                Import en masse
              </button>
            </div>
          </div>
        )}

      {/* Library Filter Bar */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={libSearch}
            onChange={(e) => setLibSearch(e.target.value)}
            placeholder="Rechercher dans mes jeux possédés..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
          />
        </div>

        {activePlatformTab === "all" && (
          <select
            value={libPlatformFilter}
            onChange={(e) =>
              setLibPlatformFilter(e.target.value as PlatformType | "all")
            }
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
          >
            <option value="all">Toutes les plateformes</option>
            {ALL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_META[p].name}
              </option>
            ))}
          </select>
        )}

        <select
          value={libStatusFilter}
          onChange={(e) => setLibStatusFilter(e.target.value as StatusFilterType)}
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="completed">🏆 Terminés à 100% (Platine)</option>
          <option value="in-progress">🔥 En cours</option>
          <option value="unstarted">⏳ À commencer (0%)</option>
        </select>

        {/* Achievement filter */}
        <select
          value={libAchievementFilter}
          onChange={(e) =>
            setLibAchievementFilter(e.target.value as AchievementFilterType)
          }
          className={`rounded-xl border px-3 py-2 text-xs outline-none transition ${
            libAchievementFilter !== "all"
              ? "border-purple-500/50 bg-purple-950/40 text-purple-200 font-bold"
              : "border-slate-800 bg-slate-950 text-slate-200 focus:border-sky-500"
          }`}
        >
          <option value="all">Tous les succès</option>
          <option value="with-achievements">🏆 Avec succès uniquement</option>
          <option value="no-achievements">⚪ Sans succès répertoriés</option>
        </select>

        {/* Sort order */}
        <select
          value={libSortOrder}
          onChange={(e) => setLibSortOrder(e.target.value as SortOrderType)}
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
        >
          <option value="default">Tri : Progression</option>
          <option value="achievements-desc">
            🏆 Nombre de succès (Décroissant)
          </option>
          <option value="achievements-asc">Nombre de succès (Croissant)</option>
          <option value="completion-desc">📈 Platines / 100% en premier</option>
          <option value="name-asc">🔤 Nom (A-Z)</option>
          <option value="playtime-desc">⏱️ Temps de jeu</option>
        </select>
      </div>

      {/* Owned Games Grid or Empty State */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGames.map((g) => (
            <LibraryGameCard
              key={`${g.platform}_${g.appId}`}
              game={g}
              steamAccount={steamAccount}
              activePlatformTab={activePlatformTab}
              selectedCollId={selectedCollId}
              wishlistIds={wishlistIds}
              collections={collections}
              onSelectGame={onSelectGame}
              onToggleWishlist={onToggleWishlist}
              onOpenAddToCollection={onOpenAddToCollection}
              onRemoveFromCollection={onRemoveFromCollection}
              onSyncGame={onSyncGame}
              onRemoveGame={onRemoveGame}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-8 text-center space-y-3">
          <Gamepad2 className="h-8 w-8 text-slate-500 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">
              {totalOwnedGamesCount === 0
                ? "Votre bibliothèque est encore vide"
                : "Aucun jeu ne correspond à ce filtre"}
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {totalOwnedGamesCount === 0
                ? "Cliquez sur « Importer Jeux & Succès » en haut avec votre SteamID pour importer automatiquement vos jeux et vos succès débloqués !"
                : "Essayez de modifier vos filtres de plateforme ou de statut."}
            </p>
          </div>
          {totalOwnedGamesCount === 0 && (
            <button
              onClick={() => onConnectAndSyncSteam()}
              disabled={isSyncingSteam}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  isSyncingSteam ? "animate-spin" : ""
                }`}
              />
              Importer mes jeux Steam maintenant
            </button>
          )}
        </div>
      )}
    </div>
  );
}
