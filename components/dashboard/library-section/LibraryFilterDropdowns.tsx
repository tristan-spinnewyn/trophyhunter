// components/dashboard/library-section/LibraryFilterDropdowns.tsx

import type { PlatformType } from "@/lib/types";
import { ALL_PLATFORMS, PLATFORM_META } from "@/lib/platforms";
import type { LibraryTab, StatusFilterType, AchievementFilterType } from "@/lib/library/library-filters";
import type { SortOrderType } from "@/lib/library/library-sort";

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
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
        >
          <option value="all">Toutes les plateformes</option>
          {ALL_PLATFORMS.map((p) => (
            <option key={p} value={p}>{PLATFORM_META[p].name}</option>
          ))}
        </select>
      )}

      <select
        value={libStatusFilter}
        onChange={(e) => setLibStatusFilter(e.target.value as StatusFilterType)}
        className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
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

      <select
        value={libSortOrder}
        onChange={(e) => setLibSortOrder(e.target.value as SortOrderType)}
        className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
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
