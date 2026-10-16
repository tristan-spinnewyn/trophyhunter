import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/profile/epic/route';
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
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

describe('GET /api/profile/epic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const db = initDatabase(':memory:');
    setDbForTesting(db);
    mockCookieStore.clear();
  });


  it('returns 400 when both user and code parameters are missing', async () => {
    const req = new Request('http://localhost:3000/api/profile/epic');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("Paramètre 'user' (pseudo Epic Games) ou 'code'");
  });

  it('configures Epic account in username-only mode without credentials', async () => {
    const req = new Request('http://localhost:3000/api/profile/epic?user=EpicGamer99');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.platform).toBe('epic');
    expect(data.account.username).toBe('EpicGamer99');
    expect(data.account.displayName).toBe('EpicGamer99');
    expect(data.notice).toContain('Compte Epic Games configuré');
  });

  it('returns 401 when Epic authorization code is expired or invalid', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      text: async () => '{"errorCode":"errors.com.epicgames.account.oauth.authorization_code_not_found"}',
    } as any);

    const req = new Request('http://localhost:3000/api/profile/epic?code=invalid-code');
    const res = await GET(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toContain("Code d'autorisation Epic Games expiré ou invalide");
  });

  it('authenticates with OAuth code and fetches owned games from array of assets', async () => {
    const mockToken = {
      access_token: 'valid_access_token_abc',
      account_id: 'epic_account_123',
      displayName: 'EpicMaster',
    };

    const mockAssets = [
      {
        appName: 'AlanWake2',
        catalogItemId: 'catalog_item_alan_wake',
      },
      {
        appName: 'UE_5.4', // Should be skipped because it starts with UE_
        catalogItemId: 'unreal_engine',
      },
      {
        appName: 'Cyberpunk2077',
        catalogItemId: 'catalog_item_cyberpunk',
      },
    ];

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssets,
      } as any);

    const req = new Request('http://localhost:3000/api/profile/epic?code=valid-code-123');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.platform).toBe('epic');
    expect(data.account.displayName).toBe('EpicMaster');
    expect(data.account.stats.gamesOwned).toBe(2);
    expect(data.discoveredGames).toHaveLength(2);
    expect(data.discoveredGames[0].platform).toBe('epic');
  });

  it('authenticates and fetches games from official library-service with metadata, images and GraphQL achievements', async () => {
    const mockToken = {
      access_token: 'valid_token_library',
      account_id: 'epic_user_456',
      displayName: 'TrophyHunterEpic',
    };

    const mockLibrary = {
      records: [
        {
          appName: 'AlanWake2',
          catalogItemId: 'cat_alan_wake',
          metadata: {
            title: 'Alan Wake 2',
            keyImages: [
              { type: 'DieselStoreFrontWide', url: 'https://cdn.epic.com/alanwake2.jpg' },
            ],
          },
        },
        {
          appName: 'UE_5.5',
          metadata: { title: 'Unreal Engine 5.5' },
        },
        {
          appName: 'Prerequisites_x64',
          metadata: { title: 'Epic Prerequisites' },
        },
        {
          appName: '002b00085aeb49b1a3f3c42e3f918f2f', // Pure hex with no title -> should be skipped
          metadata: {},
        },
        {
          appName: 'CelesteGame',
          metadata: {
            title: 'Celeste',
            keyImages: [],
          },
        },
      ],
    };

    const mockGraphQL = {
      data: {
        PlayerAchievement: {
          playerAchievementGameRecords: {
            records: [
              {
                sandboxId: 'alan_wake_sandbox',
                totalUnlocked: 25,
                achievementSets: [
                  {
                    isBase: true,
                    totalUnlocked: 25,
                    totalXP: 1000,
                  },
                ],
              },
            ],
          },
        },
      },
    };

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLibrary,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraphQL,
      } as any);

    const req = new Request('http://localhost:3000/api/profile/epic?code=lib-code-123');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.discoveredGames).toHaveLength(2);
    expect(data.discoveredGames[0].name).toBe('Alan Wake 2');
    expect(data.discoveredGames[0].headerImg).toBe('https://cdn.epic.com/alanwake2.jpg');
    expect(data.discoveredGames[1].name).toBe('Celeste');
    expect(data.account.stats.totalAchievements).toBe(25);
    expect(data.account.stats.completedGames).toBe(1);
  });

  it('falls back to assets and resolves titles from catalog-public-service when library-service returns empty', async () => {
    const mockToken = {
      access_token: 'fallback_token',
      account_id: 'epic_fallback_user',
      displayName: 'FallbackUser',
    };

    const mockLibraryEmpty = { records: [] };

    const mockAssets = [
      {
        appName: '002b00085aeb49b1a3f3c42e3f918f2f', // 32 hex hash to resolve via catalog
        catalogItemId: 'cat_hades',
        namespace: 'supergiant',
      },
      {
        appName: 'DirectX_Prerequisites',
        catalogItemId: 'prereq',
      },
      {
        appName: 'ffffffffffffffffffffffffffffffff', // Hex hash that cannot be resolved
        catalogItemId: 'cat_missing',
        namespace: 'unknown_ns',
      },
      {
        appName: 'ControlGame',
        catalogItemId: 'cat_control',
        namespace: 'remedy',
      },
    ];

    const mockCatalogBulk = [
      {
        id: 'cat_hades',
        title: 'Hades',
        keyImages: [
          { type: 'OfferImageWide', url: 'https://cdn.epic.com/hades_wide.jpg' },
        ],
      },
    ];

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLibraryEmpty,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssets,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalogBulk,
      } as any)
      .mockResolvedValueOnce({
        ok: false,
      } as any); // GraphQL fails gracefully

    const req = new Request('http://localhost:3000/api/profile/epic?code=fallback-code');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.discoveredGames).toHaveLength(2);
    expect(data.discoveredGames.some((g: any) => g.name === 'Hades')).toBe(true);
    expect(data.discoveredGames.some((g: any) => g.name === 'Control Game')).toBe(true);
  });

  it('handles external fetch failure gracefully with status 500', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Connection timed out'));

    const req = new Request('http://localhost:3000/api/profile/epic?code=crash-code');
    const res = await GET(req);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toBe("Impossible de joindre l'API Epic Games.");
    expect(data.details).toBe('Connection timed out');
  });

  it('auto-persists account and discovered games to SQLite when user is authenticated with code', async () => {
    const user = createUser('epicuser', 'hashedpassword123');
    const sessionId = createSession(user.id);
    mockCookieStore.set('trophyhunter_session', { value: sessionId });

    const mockToken = {
      access_token: 'auth_epic_token',
      account_id: 'epic_account_777',
      displayName: 'EpicHero',
    };

    const mockAssets = [
      {
        appName: 'HadesGame',
        catalogItemId: 'cat_hades_item',
      },
    ];

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssets,
      } as any);

    const req = new Request('http://localhost:3000/api/profile/epic?code=oauth-hero-code');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const accounts = getUserPlatformAccounts(user.id);
    expect(accounts.epic).toBeDefined();
    expect(accounts.epic?.platform).toBe('epic');
    expect(accounts.epic?.displayName).toBe('EpicHero');

    const games = getUserOwnedGames(user.id);
    expect(games.length).toBeGreaterThan(0);
    expect(games[0].platform).toBe('epic');
    expect(games[0].name).toBe('Hades Game');
  });

  it('auto-persists account to SQLite in username-only mode when user is authenticated', async () => {
    const user = createUser('epicuser2', 'hashedpassword123');
    const sessionId = createSession(user.id);
    mockCookieStore.set('trophyhunter_session', { value: sessionId });

    const req = new Request('http://localhost:3000/api/profile/epic?user=EpicSoloPlayer');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const accounts = getUserPlatformAccounts(user.id);
    expect(accounts.epic).toBeDefined();
    expect(accounts.epic?.platform).toBe('epic');
    expect(accounts.epic?.username).toBe('EpicSoloPlayer');
  });
});

