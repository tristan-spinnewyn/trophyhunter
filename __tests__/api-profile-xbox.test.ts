import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/profile/xbox/route';

describe('GET /api/profile/xbox', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
});
