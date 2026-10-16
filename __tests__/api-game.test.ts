import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/game/[id]/route';

describe('GET /api/game/[id]', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects invalid non-numeric app IDs', async () => {
    const req = new Request('http://localhost:3000/api/game/abc');
    const params = Promise.resolve({ id: 'abc' });
    const res = await GET(req, { params });
    expect(res.status).toBe(400);
  });

  it('parses store details and achievements with missable and secret detection', async () => {
    const mockStoreData = {
      '367520': {
        data: {
          name: 'Hollow Knight',
          header_image: 'https://cdn.example.com/hk.jpg',
          short_description: 'Metroidvania in Hallownest',
          developers: ['Team Cherry'],
          publishers: ['Team Cherry'],
        },
      },
    };

    const mockStatsHtml = `
      <div class="achieveRow">
        <img src="https://cdn.example.com/icon1.jpg">
        <h3>Fin secrète</h3>
        <h5>Découvrir toutes les fins sans mourir</h5>
        <div class="achievePercent">3.5%</div>
      </div>
      <div class="achieveRow">
        <img src="https://cdn.example.com/icon2.jpg">
        <h3>Succès secret</h3>
        <h5></h5>
        <div class="achievePercent">15%</div>
      </div>
    `;

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoreData,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockStatsHtml,
      } as any);

    const req = new Request('http://localhost:3000/api/game/367520');
    const params = Promise.resolve({ id: '367520' });
    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe(367520);
    expect(data.name).toBe('Hollow Knight');
    expect(data.totalAchievements).toBe(2);

    // Check missable heuristic ("sans mourir", "toutes les fins")
    expect(data.achievements[0].missable).toBe(true);
    expect(data.achievements[0].percent).toBe(3.5);

    // Check hidden/secret heuristic (empty description)
    expect(data.achievements[1].hidden).toBe(true);
    expect(data.achievements[1].desc).toContain('Succès secret');
  });

  it('parses official Steam WebAPI GetGameAchievements schema with localized details', async () => {
    const mockStoreData = {
      '1517290': {
        data: {
          name: 'Battlefield™ 2042',
          header_image: 'https://cdn.example.com/bf2042.jpg',
          developers: ['DICE'],
          publishers: ['Electronic Arts'],
        },
      },
    };

    const mockSchemaJson = {
      response: {
        achievements: [
          {
            internal_name: 'Achievement_GOSCC_1',
            localized_name: "S'adapter pour triompher",
            localized_desc: 'Atteindre le niveau 5.',
            icon: 'icon1.jpg',
            hidden: false,
            player_percent_unlocked: '67.4',
          },
          {
            internal_name: 'Achievement_GOSCC_2',
            localized_name: 'Dunn serait fier',
            localized_desc: '',
            icon: 'icon2.jpg',
            hidden: true,
            player_percent_unlocked: '45.1',
          },
        ],
      },
    };

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoreData,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockSchemaJson),
      } as any);

    const req = new Request('http://localhost:3000/api/game/1517290');
    const params = Promise.resolve({ id: '1517290' });
    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe(1517290);
    expect(data.name).toBe('Battlefield™ 2042');
    expect(data.totalAchievements).toBe(2);
    expect(data.achievements[0].name).toBe("S'adapter pour triompher");
    expect(data.achievements[0].desc).toBe('Atteindre le niveau 5.');
    expect(data.achievements[0].percent).toBe(67.4);
    expect(data.achievements[0].icon).toContain('community_assets/images/apps/1517290/icon1.jpg');
    expect(data.achievements[1].hidden).toBe(true);
    expect(data.achievements[1].desc).toBe('Succès secret (Masqué par le jeu)');
  });

  it('searches Steam by name and resolves achievements when appId is not on Steam directly', async () => {
    // 1. Initial direct lookup on Steam fails
    const mockEmptyStore = {};

    // 2. Search by name returns Celeste on Steam (appId 504230)
    const mockSearchResults = {
      items: [
        {
          id: 504230,
          name: 'Celeste',
        },
      ],
    };

    // 3. Secondary store lookup for matched appId 504230
    const mockSecondaryStore = {
      '504230': {
        data: {
          name: 'Celeste',
          header_image: 'https://cdn.example.com/celeste_header.jpg',
          short_description: 'Help Madeline survive her inner demons.',
          developers: ['Extremely OK Games'],
          publishers: ['Extremely OK Games'],
        },
      },
    };

    const mockSchemaJson = {
      response: {
        achievements: [
          {
            internal_name: 'CH1_COMPLETE',
            localized_name: 'Cité abandonnée',
            localized_desc: 'Terminer le Chapitre 1.',
            icon: 'icon_ch1.jpg',
            hidden: false,
            player_percent_unlocked: '80.0',
          },
        ],
      },
    };

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyStore,
      } as any) // direct store lookup -> empty
      .mockResolvedValueOnce({
        ok: false,
      } as any) // direct ach lookup -> fails
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults,
      } as any) // storesearch -> matched Celeste 504230
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecondaryStore,
      } as any) // secondary store details
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockSchemaJson),
      } as any); // secondary achievements

    const req = new Request('http://localhost:3000/api/game/99999999?name=Celeste&platform=epic');
    const params = Promise.resolve({ id: '99999999' });
    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe(99999999);
    expect(data.name).toBe('Celeste');
    expect(data.totalAchievements).toBe(1);
    expect(data.achievements[0].name).toBe('Cité abandonnée');
    expect(data.guideLinks.steamGuidesUrl).toContain('/app/504230/guides');
  });

  it('supports fast=1 mode to resolve non-Steam game achievements with minimal requests and smart title matching', async () => {
    const mockSearchResults = {
      items: [
        { id: 111111, name: 'Hades Soundtrack' },
        { id: 1145360, name: 'Hades', tiny_image: 'https://cdn.example.com/hades_tiny.jpg' },
      ],
    };

    const mockSchemaJson = {
      response: {
        achievements: [
          {
            internal_name: 'ACH_1',
            localized_name: 'Évasion',
            localized_desc: 'Franchir le Tartare.',
            icon: 'hades_ach1.jpg',
            hidden: false,
            player_percent_unlocked: '75.2',
          },
          {
            internal_name: 'ACH_2',
            localized_name: 'Fils de Hadès',
            localized_desc: 'Vaincre le boss final.',
            icon: 'hades_ach2.jpg',
            hidden: false,
            player_percent_unlocked: '42.0',
          },
        ],
      },
    };

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockSchemaJson),
      } as any);

    const req = new Request('http://localhost:3000/api/game/88888888?name=Hades%20-%20Definitive%20Edition&platform=epic&fast=1');
    const params = Promise.resolve({ id: '88888888' });
    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe(88888888);
    expect(data.totalAchievements).toBe(2);
    expect(data.achievements[0].icon).toContain('/apps/1145360/hades_ach1.jpg');
  });
});

