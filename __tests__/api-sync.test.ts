import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/sync/route';

describe('GET /api/sync', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 when user or appId is missing', async () => {
    const req1 = new Request('http://localhost:3000/api/sync?appId=367520');
    const res1 = await GET(req1);
    expect(res1.status).toBe(400);

    const req2 = new Request('http://localhost:3000/api/sync?user=shin');
    const res2 = await GET(req2);
    expect(res2.status).toBe(400);
  });

  it('detects private profile and returns 403', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      text: async () => '<html><body>Ce profil est privé</body></html>',
    } as any).mockResolvedValueOnce({
      ok: true,
      text: async () => '',
    } as any);

    const req = new Request('http://localhost:3000/api/sync?user=76561198083390097&appId=367520');
    const res = await GET(req);
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.isPrivate).toBe(true);
  });

  it('extracts unlocked achievement titles and deterministic unlockedIds', async () => {
    const playerHtml = `
      <html>
        <head><title>Communauté Steam :: Hollow Knight :: Shin :: Succès</title></head>
        <body>
          <div class="achieveRow">
            <h3>Éveil</h3>
            <div class="achieveUnlockTime">Débloqué le 1 Jan</div>
          </div>
          <div class="achieveRow">
            <h3>Chasseur aguerri</h3>
          </div>
        </body>
      </html>
    `;

    const globalHtml = `
      <html>
        <body>
          <div class="achieveRow">
            <h3>Éveil</h3>
          </div>
          <div class="achieveRow">
            <h3>Chasseur aguerri</h3>
          </div>
        </body>
      </html>
    `;

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        text: async () => playerHtml,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => globalHtml,
      } as any);

    const req = new Request('http://localhost:3000/api/sync?user=76561198083390097&appId=367520');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.gameName).toBe('Hollow Knight');
    expect(data.count).toBe(1);
    expect(data.unlockedTitles).toEqual(['Éveil']);
    expect(data.unlockedIds[0]).toContain('ach_1__veil');
  });

  it('handles 404 profile not found', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as any);

    const req = new Request('http://localhost:3000/api/sync?user=nonexistent_user&appId=123');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});
