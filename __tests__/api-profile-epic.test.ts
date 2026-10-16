import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/profile/epic/route';
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  getUserOwnedGames,
  getUserPlatformAccounts,
  getUserGameProgress,
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

  it('resolves internal Epic codenames and maps sandbox achievements from GraphQL', async () => {
    const mockToken = {
      access_token: 'token_codenames',
      account_id: 'epic_account_codenames',
      displayName: 'EpicExplorer',
    };

    const mockAssets = [
      {
        appName: 'Angelonia', // Watch Dogs 2
        catalogItemId: 'cat_angelonia',
        namespace: 'ns_watchdogs2',
      },
      {
        appName: 'Barbet', // Dishonored: Death of the Outsider
        catalogItemId: 'cat_barbet',
        namespace: 'ns_dishonored',
      },
      {
        appName: 'Catnip', // Control
        catalogItemId: 'cat_catnip',
        namespace: 'ns_control',
      },
      {
        appName: 'aa', // Aven Colony
        catalogItemId: 'cat_aa',
        namespace: 'ns_aa',
      },
    ];

    // GraphQL mock returning player achievements matching ns_watchdogs2 and ns_control
    const mockGraphQL = {
      data: {
        PlayerAchievement: {
          playerAchievementGameRecords: {
            records: [
              {
                sandboxId: 'ns_watchdogs2',
                totalUnlocked: 15,
                achievementSets: [
                  {
                    achievementSetId: 'set_wd2',
                    isBase: true,
                    totalUnlocked: 15,
                    totalXP: 500,
                  },
                ],
                playerAchievements: [
                  { playerAchievement: { achievementName: 'ach1', unlocked: true } },
                  { playerAchievement: { achievementName: 'ach2', unlocked: true } },
                  { playerAchievement: { achievementName: 'ach3', unlocked: false } },
                ],
              },
              {
                sandboxId: 'ns_control',
                totalUnlocked: 30,
                achievementSets: [
                  {
                    achievementSetId: 'set_control',
                    isBase: true,
                    totalUnlocked: 30,
                    totalXP: 1000,
                  },
                ],
                playerAchievements: new Array(30).fill(null).map((_, i) => ({
                  playerAchievement: { achievementName: `ach_${i}`, unlocked: true },
                })),
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
        json: async () => ({ records: [] }), // library-service empty, triggers fallback
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssets, // assets returned
      } as any)
      .mockResolvedValueOnce({
        ok: false, // catalog query fails, falling back to codenames dictionary
      } as any)
      .mockResolvedValueOnce({
        ok: false,
      } as any)
      .mockResolvedValueOnce({
        ok: false,
      } as any)
      .mockResolvedValueOnce({
        ok: false,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraphQL, // GraphQL achievements returned
      } as any);

    const req = new Request('http://localhost:3000/api/profile/epic?code=codenames-code');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.discoveredGames).toHaveLength(4);

    const wd2 = data.discoveredGames.find((g: any) => g.name === 'Watch Dogs 2');
    expect(wd2).toBeDefined();
    expect(wd2.totalAchievements).toBe(3);
    expect(wd2.unlockedCount).toBe(15);

    const dishonored = data.discoveredGames.find((g: any) => g.name === 'Dishonored: Death of the Outsider');
    expect(dishonored).toBeDefined();

    const control = data.discoveredGames.find((g: any) => g.name === 'Control');
    expect(control).toBeDefined();
    expect(control.totalAchievements).toBe(30);
    expect(control.unlockedCount).toBe(30);

    const aven = data.discoveredGames.find((g: any) => g.name === 'Aven Colony');
    expect(aven).toBeDefined();
  });

  it('paginates across multiple pages in library-service via cursor and parses stringified and customAttributes keyImages', async () => {
    const mockToken = {
      access_token: 'token_pagination',
      account_id: 'epic_account_paged',
      displayName: 'EpicPaginationUser',
    };

    const mockPage1 = {
      records: [
        {
          appName: 'FallGuys',
          catalogItemId: 'cat_fall_guys',
          namespace: 'ns_fallguys',
          metadata: {
            title: 'Fall Guys',
            keyImages: JSON.stringify([
              { type: 'OfferImageWide', url: 'https://cdn.epic.com/fallguys_wide.jpg' },
            ]),
          },
        },
        {
          appName: 'RocketLeague',
          catalogItemId: 'cat_rl',
          namespace: 'ns_rl',
          metadata: {
            title: 'Rocket League',
            customAttributes: {
              DieselStoreFrontWide: { value: 'https://cdn.epic.com/rl_storefront.jpg' },
            },
          },
        },
      ],
      responseMetadata: {
        nextCursor: 'cursor_token_page2',
      },
    };

    const mockPage2 = {
      records: [
        {
          appName: 'FortniteGame',
          catalogItemId: 'cat_fn',
          namespace: 'fn',
          metadata: {
            title: 'Fortnite',
            keyImages: [
              { type: 'DieselStoreFrontTall', url: 'https://cdn.epic.com/fn_tall.jpg' },
            ],
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
                sandboxId: 'ns_fallguys',
                totalUnlocked: 10,
                achievementSets: [
                  {
                    achievementSetId: 'fg_base',
                    isBase: true,
                    totalUnlocked: 10,
                    totalXP: 300,
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
        json: async () => mockPage1, // Page 1
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPage2, // Page 2 via nextCursor
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraphQL,
      } as any);

    const req = new Request('http://localhost:3000/api/profile/epic?code=pagination-code');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.discoveredGames).toHaveLength(3);

    const fg = data.discoveredGames.find((g: any) => g.name === 'Fall Guys');
    expect(fg).toBeDefined();
    expect(fg.headerImg).toBe('https://cdn.epic.com/fallguys_wide.jpg');
    expect(fg.unlockedCount).toBe(10);

    const rl = data.discoveredGames.find((g: any) => g.name === 'Rocket League');
    expect(rl).toBeDefined();
    expect(rl.headerImg).toBe('https://cdn.epic.com/rl_storefront.jpg');

    const fn = data.discoveredGames.find((g: any) => g.name === 'Fortnite');
    expect(fn).toBeDefined();
    expect(fn.headerImg).toBe('https://cdn.epic.com/fn_tall.jpg');

    expect(data.account.stats.gamesOwned).toBe(3);
    expect(data.account.stats.totalAchievements).toBe(10);
  });

  it('resolves totalAchievements via Steam schema when resolveAchievements=1 is passed', async () => {
    const mockToken = {
      access_token: 'epic_resolve_token',
      account_id: 'epic_resolve_acc',
      displayName: 'EpicResolver',
    };

    const mockLibrary = {
      records: [
        {
          appName: 'HadesEpic',
          catalogItemId: 'cat_hades',
          namespace: 'ns_hades',
          sandboxName: 'Hades - Standard Edition',
        },
      ],
    };

    const mockSteamSearch = {
      items: [
        {
          id: 1145360,
          name: 'Hades',
          tiny_image: 'https://cdn.example.com/hades_tiny.jpg',
        },
      ],
    };

    const mockSteamAch = {
      response: {
        achievements: [
          { internal_name: 'A1', localized_name: 'Succès 1' },
          { internal_name: 'A2', localized_name: 'Succès 2' },
          { internal_name: 'A3', localized_name: 'Succès 3' },
        ],
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
        ok: false, // catalog fails
      } as any)
      .mockResolvedValueOnce({
        ok: false, // Epic GraphQL fails (404)
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSteamSearch,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSteamAch,
      } as any);

    const req = new Request(
      'http://localhost:3000/api/profile/epic?code=resolve-code&resolveAchievements=1'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.discoveredGames).toHaveLength(1);
    expect(data.discoveredGames[0].totalAchievements).toBe(3);
    expect(data.discoveredGames[0].headerImg).toContain('/apps/1145360/header.jpg');
  });

  it('automatically persists user_game_progress for imported games with unlocked achievements when authenticated', async () => {
    const user = createUser('epicprogressuser', 'pass123');
    const session = createSession(user.id);
    mockCookieStore.set('trophyhunter_session', { value: session });

    const mockToken = {
      access_token: 'valid-epic-token',
      refresh_token: 'valid-refresh-token',
      account_id: 'epic-acc-id',
      displayName: 'EpicPlayer',
    };

    const mockLibrary = {
      records: [
        {
          appName: 'GameWithAch',
          catalogItemId: 'cat_gw_ach',
          namespace: 'ns_gw_ach',
          sandboxName: 'Game With Ach',
        },
      ],
    };

    const mockGql = {
      data: {
        PlayerAchievement: {
          playerAchievementGameRecords: {
            records: [
              {
                sandboxId: 'ns_gw_ach',
                totalUnlocked: 2,
                totalXP: 100,
                achievementSets: [{ totalAchievements: 10, totalUnlocked: 2 }],
                playerAchievements: [
                  { achievementName: 'First Blood', unlocked: true },
                  { achievementName: 'Second Step', unlocked: true },
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
        ok: false, // catalog fails
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGql,
      } as any);

    const req = new Request('http://localhost:3000/api/profile/epic?code=oauth-code');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.discoveredGames).toHaveLength(1);
    expect(data.discoveredGames[0].unlockedCount).toBe(2);

    // Verify progress was saved in SQLite database
    const progress = getUserGameProgress(user.id, data.discoveredGames[0].appId, 'epic');
    expect(progress).not.toBeNull();
    expect(progress?.unlockedIds).toHaveLength(2);
  });
});


