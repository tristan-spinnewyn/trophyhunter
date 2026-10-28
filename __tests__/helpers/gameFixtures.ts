// __tests__/helpers/gameFixtures.ts
import type { Achievement, GameDetails, OwnedGame } from "@/lib/types";

export function makeOwnedGame(overrides: Partial<OwnedGame> = {}): OwnedGame {
  return {
    appId: 620,
    name: "Portal 2",
    headerImg: "https://example.test/portal2.jpg",
    platform: "steam",
    totalAchievements: 10,
    unlockedCount: 4,
    addedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: "ach_1",
    name: "Wake Up Call",
    desc: "Survive the manual override.",
    icon: "https://example.test/ach1.jpg",
    percent: 42.5,
    hidden: false,
    missable: false,
    ...overrides,
  };
}

export function makeGameDetails(overrides: Partial<GameDetails> = {}): GameDetails {
  return {
    id: 620,
    name: "Portal 2",
    headerImg: "https://example.test/portal2.jpg",
    totalAchievements: 51,
    achievements: [],
    guideLinks: {
      steamGuidesUrl: "https://example.test/guides",
      psthcUrl: "https://example.test/psthc",
      youtubeUrl: "https://example.test/youtube",
    },
    ...overrides,
  };
}
