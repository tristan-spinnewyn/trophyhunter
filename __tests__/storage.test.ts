import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSavedSteamUser,
  saveSteamUser,
  getSavedSteamApiKey,
  saveSteamApiKey,
  getUserAccount,
  saveUserAccount,
  savePlatformAccount,
  removePlatformAccount,
  getOwnedGames,
  saveOwnedGames,
  upsertOwnedGames,
  removeOwnedGame,
  isGameOwned,
  getGameProgress,
  saveGameProgress,
  toggleAchievementUnlocked,
  setAchievementNote,
  resetGameProgress,
  getFavoriteGames,
  toggleFavoriteGame,
  getRecentGames,
  addRecentGame,
  exportAllData,
  importAllData,
  PLATFORM_META,
} from '@/lib/storage';
import type { PlatformAccount, OwnedGame, UserAccountProfile } from '@/lib/types';

describe('lib/storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Steam User', () => {
    it('returns default steam user if none saved', () => {
      expect(getSavedSteamUser()).toBe('76561198083390097');
    });

    it('saves and retrieves custom steam user', () => {
      saveSteamUser('custom_user');
      expect(getSavedSteamUser()).toBe('custom_user');
    });

    it('removes steam user when saving empty string', () => {
      saveSteamUser('temp');
      expect(getSavedSteamUser()).toBe('temp');
      saveSteamUser('  ');
      expect(getSavedSteamUser()).toBe('76561198083390097');
    });
  });

  describe('Steam API Key', () => {
    it('returns empty string when no API key saved', () => {
      expect(getSavedSteamApiKey()).toBe('');
    });

    it('saves, retrieves and removes API key with encryption', () => {
      saveSteamApiKey('ABC123XYZ456');
      const rawStored = localStorage.getItem('trophyhunter_steam_api_key');
      expect(rawStored).toMatch(/^enc_v1:/);
      expect(rawStored).not.toContain('ABC123XYZ456');
      expect(getSavedSteamApiKey()).toBe('ABC123XYZ456');
      saveSteamApiKey('  ');
      expect(getSavedSteamApiKey()).toBe('');
    });

    it('supports legacy unencrypted API keys', () => {
      localStorage.setItem('trophyhunter_steam_api_key', 'LEGACY_PLAIN_KEY_999');
      expect(getSavedSteamApiKey()).toBe('LEGACY_PLAIN_KEY_999');
    });
  });

  describe('User Account & Platforms', () => {
    it('returns default user account profile when storage is empty', () => {
      const account = getUserAccount();
      expect(account.displayName).toBe('Chasseur de Trophées');
      expect(account.accounts.steam?.username).toBe('76561198083390097');
    });

    it('saves user account and updates steam user in local storage', () => {
      const profile: UserAccountProfile = {
        displayName: 'Test Hunter',
        accounts: {
          steam: {
            platform: 'steam',
            username: '76561199999999999',
            displayName: 'SteamHunter',
            connectedAt: new Date().toISOString(),
            stats: { gamesOwned: 10, totalAchievements: 50, completedGames: 2 },
          },
        },
      };

      saveUserAccount(profile);
      const retrieved = getUserAccount();
      expect(retrieved.displayName).toBe('Test Hunter');
      expect(getSavedSteamUser()).toBe('76561199999999999');
    });

    it('saves a platform account and updates displayName/avatar if steam', () => {
      const steamAccount: PlatformAccount = {
        platform: 'steam',
        username: 'steam_id_123',
        displayName: 'Shin Steam',
        avatarUrl: 'https://example.com/avatar.jpg',
        connectedAt: new Date().toISOString(),
        stats: { gamesOwned: 25, totalAchievements: 100, completedGames: 5 },
      };

      const updated = savePlatformAccount(steamAccount);
      expect(updated.displayName).toBe('Shin Steam');
      expect(updated.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(updated.accounts.steam?.displayName).toBe('Shin Steam');
    });

    it('saves non-steam platform accounts without overwriting main profile display name', () => {
      const xboxAccount: PlatformAccount = {
        platform: 'xbox',
        username: 'xbox_gamer',
        displayName: 'Xbox Gamer',
        connectedAt: new Date().toISOString(),
        stats: {
          gamesOwned: 12,
          totalAchievements: 80,
          completedGames: 3,
          gamerScore: 1250,
        },
      };

      const updated = savePlatformAccount(xboxAccount);
      expect(updated.accounts.xbox?.username).toBe('xbox_gamer');
      expect(updated.accounts.xbox?.stats.gamerScore).toBe(1250);
    });

    it('removes a platform account', () => {
      const xboxAccount: PlatformAccount = {
        platform: 'xbox',
        username: 'xbox_gamer',
        displayName: 'Xbox Gamer',
        connectedAt: new Date().toISOString(),
        stats: { gamesOwned: 5, totalAchievements: 10, completedGames: 1 },
      };
      savePlatformAccount(xboxAccount);
      expect(getUserAccount().accounts.xbox).toBeDefined();

      const afterRemove = removePlatformAccount('xbox');
      expect(afterRemove.accounts.xbox).toBeUndefined();
    });

    it('removes steam user from storage when steam platform is removed', () => {
      saveSteamUser('temp_steam_user');
      removePlatformAccount('steam');
      expect(getSavedSteamUser()).toBe('76561198083390097');
    });
  });

  describe('Owned Games Library', () => {
    it('returns empty array when no owned games', () => {
      expect(getOwnedGames()).toEqual([]);
      expect(isGameOwned(123)).toBe(false);
    });

    it('upserts and retrieves owned games sorted by completion percentage', () => {
      const games: OwnedGame[] = [
        {
          appId: 10,
          name: 'Game A',
          headerImg: 'https://example.com/a.jpg',
          platform: 'steam',
          totalAchievements: 10,
          unlockedCount: 2, // 20%
          addedAt: '2026-01-01',
        },
        {
          appId: 20,
          name: 'Game B',
          headerImg: 'https://example.com/b.jpg',
          platform: 'steam',
          totalAchievements: 10,
          unlockedCount: 8, // 80%
          addedAt: '2026-01-02',
        },
      ];

      const saved = upsertOwnedGames(games);
      expect(saved.length).toBe(2);
      expect(saved[0].appId).toBe(20); // 80% comes first
      expect(saved[1].appId).toBe(10);
      expect(isGameOwned(10)).toBe(true);
      expect(isGameOwned(20)).toBe(true);
    });

    it('removes an owned game', () => {
      const game: OwnedGame = {
        appId: 99,
        name: 'Delete Me',
        headerImg: '',
        platform: 'steam',
        totalAchievements: 5,
        unlockedCount: 1,
        addedAt: '2026-01-01',
      };
      upsertOwnedGames([game]);
      expect(isGameOwned(99)).toBe(true);

      removeOwnedGame(99, 'steam');
      expect(isGameOwned(99)).toBe(false);
    });
  });

  describe('Game Progress & Notes', () => {
    it('gets empty game progress for new game', () => {
      const prog = getGameProgress(12345);
      expect(prog.unlockedIds).toEqual([]);
      expect(prog.notes).toEqual({});
    });

    it('saves progress and updates owned game unlocked count', () => {
      const owned: OwnedGame = {
        appId: 500,
        name: 'Tracked Game',
        headerImg: 'img.jpg',
        platform: 'steam',
        totalAchievements: 10,
        unlockedCount: 0,
        addedAt: '2026-01-01',
      };
      upsertOwnedGames([owned]);

      saveGameProgress(500, {
        unlockedIds: ['ach_1', 'ach_2'],
        notes: {},
        lastPlayed: '2026-10-16',
      });

      const prog = getGameProgress(500);
      expect(prog.unlockedIds).toEqual(['ach_1', 'ach_2']);

      const updatedOwned = getOwnedGames();
      const target = updatedOwned.find((g) => g.appId === 500);
      expect(target?.unlockedCount).toBe(2);
    });

    it('toggles achievement unlocked status', () => {
      const updated1 = toggleAchievementUnlocked(300, 'ach_test');
      expect(updated1.unlockedIds).toContain('ach_test');

      const updated2 = toggleAchievementUnlocked(300, 'ach_test');
      expect(updated2.unlockedIds).not.toContain('ach_test');
    });

    it('sets and updates achievement note', () => {
      setAchievementNote(400, 'ach_note_1', 'Remember to open chest');
      const prog = getGameProgress(400);
      expect(prog.notes['ach_note_1']).toBe('Remember to open chest');
    });

    it('resets game progress', () => {
      saveGameProgress(777, { unlockedIds: ['a', 'b'], notes: { a: 'note' } });
      resetGameProgress(777);
      const prog = getGameProgress(777);
      expect(prog.unlockedIds).toEqual([]);
    });
  });

  describe('Favorites & Recents', () => {
    it('toggles favorite games', () => {
      expect(getFavoriteGames()).toEqual([]);
      const favs1 = toggleFavoriteGame(1091500);
      expect(favs1).toContain(1091500);
      const favs2 = toggleFavoriteGame(1091500);
      expect(favs2).not.toContain(1091500);
    });

    it('adds and limits recent games to 10', () => {
      for (let i = 1; i <= 15; i++) {
        addRecentGame(i);
      }
      const recents = getRecentGames();
      expect(recents.length).toBe(10);
      expect(recents[0]).toBe(15);
    });
  });

  describe('Data Export & Import', () => {
    it('exports and imports all trophyhunter data correctly', () => {
      saveSteamUser('exported_user');
      toggleFavoriteGame(1234);

      const jsonStr = exportAllData();
      expect(jsonStr).toContain('exported_user');
      expect(jsonStr).toContain('1234');

      localStorage.clear();
      expect(getFavoriteGames()).toEqual([]);

      const imported = importAllData(jsonStr);
      expect(imported).toBe(true);
      expect(getSavedSteamUser()).toBe('exported_user');
      expect(getFavoriteGames()).toContain(1234);
    });

    it('handles invalid JSON import gracefully', () => {
      const result = importAllData('invalid json text');
      expect(result).toBe(false);
    });
  });

  describe('PLATFORM_META', () => {
    it('defines metadata for all 4 supported platforms', () => {
      expect(PLATFORM_META.steam.name).toBe('Steam');
      expect(PLATFORM_META.xbox.name).toBe('Xbox Live');
      expect(PLATFORM_META.epic.shortName).toBe('Epic');
      expect(PLATFORM_META.gog.name).toBe('GOG Galaxy');
      expect(Object.keys(PLATFORM_META)).toEqual(['steam', 'xbox', 'epic', 'gog']);
    });
  });
});
