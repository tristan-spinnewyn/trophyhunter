import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/profile/xbox/route';
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  saveUserPlatformAccount,
  getUserOwnedGames,
  getUserPlatformAccounts,
} from '@/lib/db';

const mockCookieStore = new Map<string, any>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string, options: any) => mockCookieStore.set(name, { name, value, ...options }),
    delete: (name: string) => mockCookieStore.delete(name),
  }),
}));

describe('GET /api/profile/xbox', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const db = initDatabase(':memory:');
    setDbForTesting(db);
    mockCookieStore.clear();
  });

  it('returns 400 when user parameter is missing', async () => {
    const req = new Request('http://localhost:3000/api/profile/xbox');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("Paramètre 'user' requis");
  });

  it('registers Xbox account without API key in fallback mode', async () => {
    const req = new Request('http://localhost:3000/api/profile/xbox?user=MajorNelson');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.platform).toBe('xbox');
    expect(data.account.username).toBe('MajorNelson');
    expect(data.account.displayName).toBe('MajorNelson');
    expect(data.notice).toContain('OpenXBL');
  });

  it('synchronizes profile and title history when OpenXBL API key is provided', async () => {
    const mockProfileResponse = {
      profileUsers: [
        {
          id: '2533274812345678',
          settings: [
            { id: 'Gamertag', value: 'Major Nelson' },
            { id: 'GameDisplayPicRaw', value: 'https://avatar.xboxlive.com/pic.png' },
            { id: 'Gamerscore', value: '98500' },
          ],
        },
      ],
    };

    const mockTitlesResponse = {
      titles: [
        {
          titleId: '123456',
          name: 'Halo Infinite',
          displayImage: 'https://images.xbox.com/halo.jpg',
          achievement: {
            currentAchievements: 50,
            totalAchievements: 50,
            currentGamerscore: 1000,
            totalGamerscore: 1000,
          },
        },
        {
          titleId: '789012',
          name: 'Forza Horizon 5',
          image: 'forza.jpg',
          achievement: {
            currentAchievements: 25,
            totalAchievements: 100,
            currentGamerscore: 500,
            totalGamerscore: 1500,
          },
        },
      ],
    };

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfileResponse,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTitlesResponse,
      } as any);

    const req = new Request('http://localhost:3000/api/profile/xbox?user=MajorNelson&key=mock-key-123');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.displayName).toBe('Major Nelson');
    expect(data.account.stats.gamerScore).toBe(98500);
    expect(data.account.stats.totalAchievements).toBe(75);
    expect(data.account.stats.completedGames).toBe(1);
    expect(data.discoveredGames).toHaveLength(2);
    expect(data.discoveredGames[0].name).toBe('Halo Infinite');
    expect(data.discoveredGames[0].totalAchievements).toBe(50);
    expect(data.discoveredGames[0].unlockedCount).toBe(50);
  });

  it('resolves encrypted key and auto-persists to SQLite for authenticated user', async () => {
    const user = createUser('XboxAuthUser', 'password123');
    const sessionId = createSession(user.id);
    mockCookieStore.set('trophyhunter_session', { value: sessionId });

    saveUserPlatformAccount(
      user.id,
      {
        platform: 'xbox',
        username: 'Chief117',
        displayName: 'Master Chief',
        connectedAt: new Date().toISOString(),
        stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 },
      },
      'ENCRYPTED_OPENXBL_KEY'
    );

    const mockProfileResponse = {
      profileUsers: [
        {
          id: '117117117',
          settings: [
            { id: 'Gamertag', value: 'Master Chief' },
            { id: 'Gamerscore', value: '50000' },
          ],
        },
      ],
    };

    const mockTitlesResponse = {
      titles: [
        {
          titleId: '555',
          name: 'Halo 3',
          displayImage: 'halo3.jpg',
          achievement: {
            currentAchievements: 40,
            totalAchievements: 40,
          },
        },
      ],
    };

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfileResponse,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTitlesResponse,
      } as any);

    // No key passed in query string -> fallback to stored encrypted key
    const req = new Request('http://localhost:3000/api/profile/xbox?user=Chief117');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const savedGames = getUserOwnedGames(user.id);
    expect(savedGames.length).toBe(1);
    expect(savedGames[0].name).toBe('Halo 3');

    const accounts = getUserPlatformAccounts(user.id);
    expect(accounts.xbox).toBeDefined();
  });

  it('persists fallback account to SQLite when authenticated without live key', async () => {
    const user = createUser('XboxFallbackUser', 'password123');
    const sessionId = createSession(user.id);
    mockCookieStore.set('trophyhunter_session', { value: sessionId });

    const req = new Request('http://localhost:3000/api/profile/xbox?user=NoKeyGamer');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const accounts = getUserPlatformAccounts(user.id);
    expect(accounts.xbox).toBeDefined();
    expect(accounts.xbox?.username).toBe('NoKeyGamer');
  });
});
