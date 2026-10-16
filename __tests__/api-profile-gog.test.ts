import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/profile/gog/route';

describe('GET /api/profile/gog', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 when user parameter is missing', async () => {
    const req = new Request('http://localhost:3000/api/profile/gog');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("Paramètre 'user' (pseudo GOG) requis");
  });

  it('scrapes public GOG profile for avatar and game count', async () => {
    const mockHtml = `
      <div class="user-avatar-container">
        <img class="user-avatar" src="https://images.gog.com/avatar.jpg" />
      </div>
      <div class="user-stats__item-count">42</div>
    `;

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    } as any);

    const req = new Request('http://localhost:3000/api/profile/gog?user=GwentMaster');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.platform).toBe('gog');
    expect(data.account.username).toBe('GwentMaster');
    expect(data.account.avatarUrl).toBe('https://images.gog.com/avatar.jpg');
    expect(data.account.stats.gamesOwned).toBe(42);
    expect(data.discoveredGames).toEqual([]);
  });

  it('fetches owned games when GOG session token is provided', async () => {
    const mockHtml = `
      <img class="avatar" src="//images.gog.com/avatar2.jpg" />
    `;

    const mockLibrary = {
      owned: [1207658924, 1424340324, 1984245678],
    };

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLibrary,
      } as any);

    const req = new Request('http://localhost:3000/api/profile/gog?user=GwentMaster&token=gog-session-token');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.avatarUrl).toBe('https://images.gog.com/avatar2.jpg');
    expect(data.account.stats.gamesOwned).toBe(3);
    expect(data.discoveredGames).toHaveLength(3);
    expect(data.discoveredGames[0].platform).toBe('gog');
    expect(data.discoveredGames[0].appId).toBe(1207658924);
  });
});
