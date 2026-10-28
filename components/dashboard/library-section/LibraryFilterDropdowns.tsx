// components/dashboard/library-section/LibraryFilterDropdowns.tsx

import type { PlatformType } from "@/lib/types";
import { ALL_PLATFORMS, PLATFORM_META } from "@/lib/platforms";
import type { LibraryTab, StatusFilterType, AchievementFilterType } from "@/lib/library/library-filters";
import type { SortOrderType } from "@/lib/library/library-sort";

/** Filters that narrow the list are highlighted so the user sees why games are missing. */
function selectClass(isFiltering: boolean): string {
  return `min-w-0 rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-sky-500 ${
    isFiltering
      ? "border-sky-500/50 bg-sky-500/10 text-sky-200"
      : "border-slate-800 bg-slate-900 text-slate-200"
  }`;
}

interface LibraryFilterDropdownsProps {
  activePlatformTab: LibraryTab;
  libPlatformFilter: PlatformType | "all";
  setLibPlatformFilter: (val: PlatformType | "all") => void;
  libStatusFilter: StatusFilterType;
  setLibStatusFilter: (val: StatusFilterType) => void;
  libAchievementFilter: AchievementFilterType;
  setLibAchievementFilter: (val: AchievementFilterType) => void;
  libSortOrder: SortOrderType;
  setLibSortOrder: (val: SortOrderType) => void;
}

export function LibraryFilterDropdowns({
  activePlatformTab,
  libPlatformFilter,
  setLibPlatformFilter,
  libStatusFilter,
  setLibStatusFilter,
  libAchievementFilter,
  setLibAchievementFilter,
  libSortOrder,
  setLibSortOrder,
}: LibraryFilterDropdownsProps) {
  return (
    <>
      {activePlatformTab === "all" && (
        <select
          value={libPlatformFilter}
          onChange={(e) => setLibPlatformFilter(e.target.value as PlatformType | "all")}
          aria-label="Plateforme"
          className={selectClass(libPlatformFilter !== "all")}
        >
          <option value="all">Plateformes</option>
          {ALL_PLATFORMS.map((p) => (
            <option key={p} value={p}>{PLATFORM_META[p].name}</option>
          ))}
        </select>
      )}

      <select
        value={libStatusFilter}
        onChange={(e) => setLibStatusFilter(e.target.value as StatusFilterType)}
        aria-label="Statut"
        className={selectClass(libStatusFilter !== "all")}
      >
        <option value="all">Tous les statuts</option>
        <option value="backlog">📚 Backlog</option>
        <option value="in-progress">🔥 En cours</option>
        <option value="completed">✅ Terminés</option>
        <option value="platinum">🏆 Platines (100%)</option>
      </select>

      <select
        value={libAchievementFilter}
        onChange={(e) => setLibAchievementFilter(e.target.value as AchievementFilterType)}
        aria-label="Succès"
        className={selectClass(libAchievementFilter !== "all")}
      >
        <option value="all">Tous les succès</option>
        <option value="with-achievements">🏆 Avec succès uniquement</option>
        <option value="no-achievements">⚪ Sans succès répertoriés</option>
      </select>

      <select
        value={libSortOrder}
        onChange={(e) => setLibSortOrder(e.target.value as SortOrderType)}
        aria-label="Tri"
        className={selectClass(false)}
      >
        <option value="default">Tri : Progression</option>
        <option value="achievements-desc">🏆 Nombre de succès (Décroissant)</option>
        <option value="achievements-asc">Nombre de succès (Croissant)</option>
        <option value="completion-desc">📈 Platines / 100% en premier</option>
        <option value="name-asc">🔤 Nom (A-Z)</option>
        <option value="playtime-desc">⏱️ Temps de jeu</option>
      </select>
    </>
  );
}
