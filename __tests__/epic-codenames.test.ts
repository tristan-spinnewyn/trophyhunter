import { describe, it, expect } from 'vitest';
import {
  isUnsplashPlaceholder,
  resolveEpicCodename,
  DEFAULT_EPIC_COVER,
  KNOWN_EPIC_CODENAMES,
} from '@/lib/epic-codenames';

describe('epic-codenames utilities', () => {
  describe('isUnsplashPlaceholder', () => {
    it('returns true for null or undefined or empty url', () => {
      expect(isUnsplashPlaceholder(null)).toBe(true);
      expect(isUnsplashPlaceholder(undefined)).toBe(true);
      expect(isUnsplashPlaceholder('')).toBe(true);
    });

    it('returns true for DEFAULT_EPIC_COVER', () => {
      expect(isUnsplashPlaceholder(DEFAULT_EPIC_COVER)).toBe(true);
    });

    it('returns true for images.unsplash.com URLs', () => {
      expect(
        isUnsplashPlaceholder('https://images.unsplash.com/photo-123456?w=600')
      ).toBe(true);
    });

    it('returns false for non-unsplash URLs', () => {
      expect(
        isUnsplashPlaceholder('https://cdn.akamai.steamstatic.com/steam/apps/480/header.jpg')
      ).toBe(false);
      expect(
        isUnsplashPlaceholder('https://cdn1.epicgames.com/item/header.png')
      ).toBe(false);
    });

    it('returns false for malformed URLs that throw', () => {
      expect(isUnsplashPlaceholder('not-a-valid-url')).toBe(false);
    });
  });

  describe('resolveEpicCodename', () => {
    it('resolves known codenames regardless of casing and whitespace', () => {
      expect(resolveEpicCodename('clary')).toBe('Celeste');
      expect(resolveEpicCodename('  CLARY  ')).toBe('Celeste');
      expect(resolveEpicCodename('wasabi')).toBe('World War Z');
      expect(resolveEpicCodename('rose')).toBe('Red Dead Redemption 2');
    });

    it('returns null for unknown codenames or falsy values', () => {
      expect(resolveEpicCodename('')).toBeNull();
      expect(resolveEpicCodename('unknown_game_xyz')).toBeNull();
      // @ts-expect-error test invalid argument
      expect(resolveEpicCodename(null)).toBeNull();
    });

    it('exposes KNOWN_EPIC_CODENAMES map', () => {
      expect(KNOWN_EPIC_CODENAMES['clary']).toBe('Celeste');
    });
  });
});
