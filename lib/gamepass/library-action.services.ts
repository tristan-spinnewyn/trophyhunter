// lib/gamepass/library-action.services.ts

import type { OwnedGame } from "@/lib/types";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";
import { mergeGamesList } from "@/lib/library/game-list";

export interface AddGamePassToLibraryParams {
  readonly item: GamePassCatalogItem;
  readonly ownedGames: readonly OwnedGame[];
  readonly onOwnedGamesChange: (games: OwnedGame[]) => void;
  readonly persistGames: (games: OwnedGame[]) => Promise<void>;
  readonly setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
}

export function buildOwnedGameFromGamePass(
  item: GamePassCatalogItem,
  nowIso = new Date().toISOString()
): OwnedGame {
  return {
    appId: item.appId,
    name: item.name,
    headerImg: item.headerImg,
    platform: "xbox",
    totalAchievements: 0,
    unlockedCount: 0,
    addedAt: nowIso,
    source: "manual",
  };
}

export async function addGamePassItemToXboxLibrary(
  params: AddGamePassToLibraryParams
): Promise<OwnedGame> {
  const { item, ownedGames, onOwnedGamesChange, persistGames, setBannerMsg } = params;
  const newGame = buildOwnedGameFromGamePass(item);
  const updatedList = mergeGamesList([...ownedGames], [newGame]);
  onOwnedGamesChange(updatedList);
  await persistGames([newGame]);
  setBannerMsg({
    type: "success",
    text: `"${item.name}" (PC Game Pass / Xbox) ajouté à votre bibliothèque !`,
  });
  return newGame;
}
