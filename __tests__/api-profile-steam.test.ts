import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/profile/steam/route';
import { initDatabase, setDbForTesting, createUser, createSession, saveUserPlatformAccount, getUserOwnedGames } from '@/lib/db';

const mockCookieStore = new Map<string, any>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string, options: any) => mockCookieStore.set(name, { name, value, ...options }),
    delete: (name: string) => mockCookieStore.delete(name),
  }),
}));

describe('GET /api/profile/steam', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const db = initDatabase(':memory:');
    setDbForTesting(db);
    mockCookieStore.clear();
  });


  it('returns 400 when user param is missing', async () => {
    const req = new Request('http://localhost:3000/api/profile/steam');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain('requis');
  });

  it('parses steam profile XML, HTML showcases, stats, and filters seasonal badges', async () => {
    const mockXml = `
      <profile>
        <steamID64>76561198000000000</steamID64>
        <steamID><![CDATA[TestGamer [FR]]]></steamID>
        <onlineState>online</onlineState>
        <memberSince>February 6, 2013</memberSince>
        <location><![CDATA[France]]></location>
        <hoursPlayed2Wk>1.5</hoursPlayed2Wk>
        <avatarFull><![CDATA[https://avatars.example.com/testgamer.jpg]]></avatarFull>
      </profile>
    `;

    const mockHtml = `
      <div class="actual_persona_name">TestGamer [FR]</div>
      <div class="friendPlayerLevelNum">32</div>
      <span class="count_link_label">Jeux</span>
      <span class="profile_count_link_total">219</span>
      <div class="value">768</div>
      <div class="label">Succès</div>
      <div class="value">9</div>
      <div class="label">Jeux et groupes terminés</div>
      <div class="value">331</div>
      <div class="label">DLC</div>
      <div class="value">44</div>
      <div class="label">Dans votre liste de souhaits</div>

      <div class="showcase_achievement" data-tooltip-html="Hollow Knight<br>Purification<br>0,9 % des joueurs">
        <a href="https://steamcommunity.com/profiles/76561198000000000/achievements/367520">
          <img src="https://cdn.example.com/hk_icon.jpg">
        </a>
      </div>

      <div class="recent_game">
        <a href="https://steamcommunity.com/app/367520"></a>
        <div class="game_name"><a>Hollow Knight</a></div>
        <div class="game_info_details">4,6 h en tout</div>
        <div class="game_info_achievement_summary">5 succès sur 63</div>
      </div>

      <div class="showcase_achievementscompletionist_game ">
        <a href="https://steamcommunity.com/profiles/76561198000000000/achievements/50300">
          <div class="num_achievements">50</div>
        </a>
      </div>
    `;

    const mockBadgesHtml = `
      <div class="badge_row ">
        <a href="https://steamcommunity.com/profiles/76561198000000000/gamecards/412020/"></a>
        <div class="badge_title">Metro Exodus</div>
      </div>
      <div class="badge_row ">
        <a href="https://steamcommunity.com/profiles/76561198000000000/gamecards/2861720/"></a>
        <div class="badge_title">Soldes d'hiver 2024</div>
      </div>
    `;

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockXml,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockBadgesHtml,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      } as any)
      // Mock store lookup for 50300
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ '50300': { data: { name: 'Spec Ops: The Line' } } }),
      } as any);

    const req = new Request('http://localhost:3000/api/profile/steam?user=76561198000000000');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);

    // Profile details
    expect(data.account.displayName).toBe('TestGamer [FR]');
    expect(data.account.level).toBe(32);
    expect(data.account.stats.gamesOwned).toBe(219);
    expect(data.account.stats.totalAchievements).toBe(768);
    expect(data.account.stats.completedGames).toBe(9);
    expect(data.account.stats.dlcCount).toBe(331);
    expect(data.account.stats.wishlistCount).toBe(44);

    // Rare showcase
    expect(data.account.rareShowcase.length).toBe(1);
    expect(data.account.rareShowcase[0].gameName).toBe('Hollow Knight');
    expect(data.account.rareShowcase[0].achievementName).toBe('Purification');
    expect(data.account.rareShowcase[0].percent).toBe(0.9);

    // Discovered games & seasonal badge exclusion
    const appIds = data.discoveredGames.map((g: any) => g.appId);
    expect(appIds).toContain(367520); // Recent + Rare
    expect(appIds).toContain(50300); // 100% showcase
    expect(appIds).toContain(412020); // Metro Exodus from badges
    expect(appIds).not.toContain(2861720); // Excluded seasonal sale badge
  });

  it('handles profile not found error', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<profile><error>The specified profile could not be found.</error></profile>',
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<html><body>The specified profile could not be found.</body></html>',
      } as any)
      .mockResolvedValueOnce({ ok: false } as any)
      .mockResolvedValueOnce({ ok: false } as any);

    const req = new Request('http://localhost:3000/api/profile/steam?user=unknown_user_123');
    const res = await GET(req);
    expect(res.status).toBe(404);

    const data = await res.json();
    expect(data.error).toContain('introuvable');
  });

  it('imports complete owned games list when Steam API key is provided', async () => {
    const mockXml = `
      <profile>
        <steamID64>76561198000000000</steamID64>
        <steamID><![CDATA[TestGamer [FR]]]></steamID>
      </profile>
    `;

    const mockHtml = `
      <div class="actual_persona_name">TestGamer [FR]</div>
      <span class="count_link_label">Jeux</span>
      <span class="profile_count_link_total">219</span>
    `;

    const mockOwnedGamesJson = {
      response: {
        game_count: 219,
        games: [
          {
            appid: 1517290,
            name: 'Battlefield™ 2042',
            playtime_forever: 360,
          },
          {
            appid: 1091500,
            name: 'Cyberpunk 2077',
            playtime_forever: 1200,
          },
        ],
      },
    };

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockXml,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      } as any)
      .mockResolvedValueOnce({ ok: false } as any) // badges
      .mockResolvedValueOnce({ ok: false } as any) // recommended
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOwnedGamesJson,
      } as any); // GetOwnedGames

    const req = new Request('http://localhost:3000/api/profile/steam?user=76561198000000000&key=MY_API_KEY_123');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.stats.gamesOwned).toBe(219);
    expect(data.discoveredGames.length).toBe(2);
    expect(data.discoveredGames[0].appId).toBe(1517290);
    expect(data.discoveredGames[0].name).toBe('Battlefield™ 2042');
    expect(data.discoveredGames[0].playtimeHours).toBe(6);
    expect(data.discoveredGames[1].appId).toBe(1091500);
    expect(data.discoveredGames[1].name).toBe('Cyberpunk 2077');
    expect(data.discoveredGames[1].playtimeHours).toBe(20);
  });

  it('automatically resolves encrypted API key and persists games to SQLite for authenticated user', async () => {
    const user = createUser('SteamUserAuth', 'password123');
    const sessionId = createSession(user.id);
    mockCookieStore.set('trophyhunter_session', { value: sessionId });

    saveUserPlatformAccount(
      user.id,
      {
        platform: 'steam',
        username: '76561198000000000',
        displayName: 'SteamUserAuth',
        connectedAt: new Date().toISOString(),
        stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 },
      },
      'STORED_SECRET_KEY'
    );

    const mockXml = `<profile><steamID64>76561198000000000</steamID64><steamID>TestGamer</steamID></profile>`;
    const mockHtml = `<div class="actual_persona_name">TestGamer</div>`;
    const mockOwned = {
      response: {
        game_count: 1,
        games: [{ appid: 42, name: 'Stored Game', playtime_forever: 120 }],
      },
    };

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, text: async () => mockXml } as any)
      .mockResolvedValueOnce({ ok: true, text: async () => mockHtml } as any)
      .mockResolvedValueOnce({ ok: false } as any)
      .mockResolvedValueOnce({ ok: false } as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockOwned } as any);

    const req = new Request('http://localhost:3000/api/profile/steam?user=76561198000000000');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const savedGames = getUserOwnedGames(user.id);
    expect(savedGames.length).toBe(1);
    expect(savedGames[0].name).toBe('Stored Game');
  });
});

