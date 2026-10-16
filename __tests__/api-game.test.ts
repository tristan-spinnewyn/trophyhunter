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
});
