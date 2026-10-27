// components/dashboard/library-section/LibrarySectionHeader.tsx

import { Gamepad2, Plus } from "lucide-react";
import type { UserAccountProfile } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import type { DashboardTabType } from "@/components/dashboard/DashboardNavTabs";
import { SteamMissingGamesNotice } from "./SteamMissingGamesNotice";

interface LibrarySectionHeaderProps {
  activePlatformTab: DashboardTabType;
  filteredCount: number;
  totalOwnedGamesCount: number;
  platformGameCount: number;
  steamAccount?: UserAccountProfile["accounts"]["steam"];
  onOpenAddGame: () => void;
  onAddApiKeyClick: () => void;
}

export function LibrarySectionHeader({
  activePlatformTab,
  filteredCount,
  totalOwnedGamesCount,
  platformGameCount,
  steamAccount,
  onOpenAddGame,
  onAddApiKeyClick,
}: LibrarySectionHeaderProps) {
  const title =
    activePlatformTab === "all" || activePlatformTab === "gamepass"
      ? `Mes Jeux Possédés (${filteredCount}${
          totalOwnedGamesCount !== filteredCount ? ` / ${totalOwnedGamesCount}` : ""
        })`
      : activePlatformTab === "wishlist"
      ? `Ma Liste d'envies (${filteredCount})`
      : activePlatformTab === "collections"
      ? `Jeux de la collection (${filteredCount})`
      : activePlatformTab === "duplicates"
      ? `Tous les jeux détectés en doublons (${filteredCount})`
      : `Mes Jeux ${PLATFORM_META[activePlatformTab].name} (${filteredCount}${
          platformGameCount !== filteredCount ? ` / ${platformGameCount}` : ""
        })`;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-sky-400" />
            {title}
          </h3>
          <p className="text-xs text-slate-400">
            Cliquez sur un jeu pour consulter sa checklist de succès en français et ses guides.
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

      {steamAccount && (
        <SteamMissingGamesNotice
          steamAccount={steamAccount}
          totalOwnedGamesCount={totalOwnedGamesCount}
          onAddApiKeyClick={onAddApiKeyClick}
          onOpenAddGame={onOpenAddGame}
        />
      )}
    </>
  );
}
