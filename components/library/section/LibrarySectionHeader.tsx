// components/library/section/LibrarySectionHeader.tsx

import type { UserAccountProfile } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import type { LibraryTab } from "@/lib/library/library-filters";
import { SteamMissingGamesNotice } from "./SteamMissingGamesNotice";

interface LibrarySectionHeaderProps {
  activePlatformTab: LibraryTab;
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
      ? `Tous mes jeux (${filteredCount}${
          totalOwnedGamesCount !== filteredCount ? ` / ${totalOwnedGamesCount}` : ""
        })`
      : activePlatformTab === "wishlist"
      ? `Ma liste d'envies (${filteredCount})`
      : activePlatformTab === "collections"
      ? `Jeux de la collection (${filteredCount})`
      : activePlatformTab === "duplicates"
      ? `Jeux en doublon (${filteredCount})`
      : `Mes jeux ${PLATFORM_META[activePlatformTab].name} (${filteredCount}${
          platformGameCount !== filteredCount ? ` / ${platformGameCount}` : ""
        })`;

  return (
    <>
      <h2 className="text-lg font-semibold text-white">{title}</h2>

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
