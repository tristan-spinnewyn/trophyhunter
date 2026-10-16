import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/profile/epic/route';

describe('GET /api/profile/epic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

  it('authenticates with OAuth code and fetches owned games from Epic assets endpoint', async () => {
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
});
