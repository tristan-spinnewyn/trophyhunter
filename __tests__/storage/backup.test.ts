// __tests__/storage/backup.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSteamUser,
  getSavedSteamUser,
  toggleFavoriteGame,
  getFavoriteGames,
  exportAllData,
  importAllData,
} from "@/lib/storage";

describe("Storage Data Export & Import", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("exports and imports trophyhunter data correctly", () => {
    saveSteamUser("exported_user");
    toggleFavoriteGame(1234);

    const jsonStr = exportAllData();
    expect(jsonStr).toContain("exported_user");
    expect(jsonStr).toContain("1234");

    localStorage.clear();
    expect(getFavoriteGames()).toEqual([]);

    const imported = importAllData(jsonStr);
    expect(imported).toBe(true);
    expect(getSavedSteamUser()).toBe("exported_user");
    expect(getFavoriteGames()).toContain(1234);
  });

  it("handles invalid JSON import gracefully", () => {
    const result = importAllData("invalid json text");
    expect(result).toBe(false);
  });
});
