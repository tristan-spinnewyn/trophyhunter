// __tests__/lib/gamepass/gamepassLibraryAction.services.test.ts

import { describe, it, expect, vi } from "vitest";
import {
  buildOwnedGameFromGamePass,
  addGamePassItemToXboxLibrary,
} from "@/components/dashboard/gamepass/gamepassLibraryAction.services";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";

const SAMPLE_ITEM: GamePassCatalogItem = {
  storeId: "9NPDN9R45JX4",
  appId: 1615431074,
  name: "1000xRESIST",
  headerImg: "https://store-images.s-microsoft.com/p.png",
  developer: "sunset visitor",
  publisher: "Fellow Traveller",
  category: "Action",
  shortDescription: "Sci-fi",
  hasXboxAchievements: true,
  isPlayAnywhere: true,
};

describe("components/dashboard/gamepass/gamepassLibraryAction.services", () => {
  it("buildOwnedGameFromGamePass constructs a valid Xbox OwnedGame entry", () => {
    const owned = buildOwnedGameFromGamePass(SAMPLE_ITEM, "2026-10-18T10:00:00.000Z");
    expect(owned).toEqual({
      appId: 1615431074,
      name: "1000xRESIST",
      headerImg: "https://store-images.s-microsoft.com/p.png",
      platform: "xbox",
      totalAchievements: 0,
      unlockedCount: 0,
      addedAt: "2026-10-18T10:00:00.000Z",
      source: "manual",
    });
  });

  it("addGamePassItemToXboxLibrary updates state, persists to SQLite and triggers banner", async () => {
    const onOwnedGamesChange = vi.fn();
    const persistGames = vi.fn().mockResolvedValue(undefined);
    const setBannerMsg = vi.fn();

    const created = await addGamePassItemToXboxLibrary({
      item: SAMPLE_ITEM,
      ownedGames: [],
      onOwnedGamesChange,
      persistGames,
      setBannerMsg,
    });

    expect(created.appId).toBe(1615431074);
    expect(onOwnedGamesChange).toHaveBeenCalledTimes(1);
    expect(persistGames).toHaveBeenCalledWith([created]);
    expect(setBannerMsg).toHaveBeenCalledWith({
      type: "success",
      text: '"1000xRESIST" (PC Game Pass / Xbox) ajouté à votre bibliothèque !',
    });
  });
});
