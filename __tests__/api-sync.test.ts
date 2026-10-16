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

  it('syncs achievements from playerstats XML and GetGameAchievements schema (Battlefield 2042)', async () => {
    const mockPlayerXml = `
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <playerstats>
        <privacyState>public</privacyState>
        <visibilityState>3</visibilityState>
        <game>
          <gameName><![CDATA[Battlefield™ 2042]]></gameName>
        </game>
        <achievements>
          <achievement closed="1">
            <apiname><![CDATA[achievement_goscc_1]]></apiname>
            <name><![CDATA[Adapt and Overcome]]></name>
          </achievement>
          <achievement closed="0">
            <apiname><![CDATA[achievement_goscc_2]]></apiname>
            <name><![CDATA[Making Dunn Proud]]></name>
          </achievement>
        </achievements>
      </playerstats>
    `;

    const mockSchemaJson = {
      response: {
        achievements: [
          {
            internal_name: 'Achievement_GOSCC_1',
            localized_name: "S'adapter pour triompher",
          },
          {
            internal_name: 'Achievement_GOSCC_2',
            localized_name: 'Dunn serait fier',
          },
        ],
      },
    };

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockPlayerXml,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockSchemaJson),
      } as any);

    const req = new Request('http://localhost:3000/api/sync?user=76561198083390097&appId=1517290');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.gameName).toBe('Battlefield™ 2042');
    expect(data.totalAchievements).toBe(2);
    expect(data.count).toBe(1);
    expect(data.unlockedTitles).toEqual(["S'adapter pour triompher"]);
    expect(data.unlockedIds).toEqual(['ach_1_s_adapter_pour_triompher']);
  });
});
