// __tests__/storage/collections.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  getLocalCollections,
  saveLocalCollections,
  PLATFORM_META,
  clearLegacyLocalStorage,
} from "@/lib/storage";

describe("Storage Collections & Legacy Cleanup", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defines supported platforms metadata", () => {
    expect(PLATFORM_META.steam.name).toBe("Steam");
    expect(PLATFORM_META.xbox.name).toBe("Xbox Live");
    expect(PLATFORM_META.epic.shortName).toBe("Epic");
    expect(PLATFORM_META.gog.name).toBe("GOG Galaxy");
    expect(Object.keys(PLATFORM_META)).toEqual(["steam", "xbox", "epic", "gog"]);
  });

  it("saves and retrieves local collections", () => {
    expect(getLocalCollections()).toEqual([]);
    const coll = [{ id: "c1", name: "Favorites", gameIds: [100, 200] }];
    saveLocalCollections(coll);
    expect(getLocalCollections()).toEqual(coll);
  });

  it("clears legacy trophyhunter keys while preserving external keys", () => {
    localStorage.setItem("trophyhunter_owned_games", JSON.stringify([{ appId: 10 }]));
    localStorage.setItem("trophyhunter_favorites", JSON.stringify([10]));
    localStorage.setItem("other_app_key", "keep_me");

    clearLegacyLocalStorage();

    expect(localStorage.getItem("trophyhunter_owned_games")).toBeNull();
    expect(localStorage.getItem("trophyhunter_favorites")).toBeNull();
    expect(localStorage.getItem("other_app_key")).toBe("keep_me");
  });
});
