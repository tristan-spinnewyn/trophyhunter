// @vitest-environment jsdom
// __tests__/app/game/useGameDetails.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useGameDetails } from "@/app/game/[id]/hooks/useGameDetails";
import type { OwnedGame, UserAccountProfile } from "@/lib/types";
import { jsonResponse } from "../../helpers/responses";

const user = { id: "u1", username: "gabe", displayName: "Gabe", createdAt: "x" };
const details = {
  id: 620, name: "Portal 2", headerImg: "https://cdn/p2.jpg", totalAchievements: 2,
  achievements: [
    { id: "a1", name: "Wake Up Call", desc: "", icon: "", percent: 50, hidden: false, missable: false },
    { id: "a2", name: "You Monster", desc: "", icon: "", percent: 30, hidden: false, missable: false },
  ],
  guideLinks: { steamGuidesUrl: "", psthcUrl: "", youtubeUrl: "" },
};
const noAccounts: UserAccountProfile = { displayName: "P", accounts: {} };

function server(routes: Record<string, unknown>) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.startsWith(k));
    if (!key) return jsonResponse({}, 404);
    const value = routes[key];
    return value instanceof Response ? value : jsonResponse(value);
  });
}

const params = (overrides: Partial<Parameters<typeof useGameDetails>[0]> = {}) => ({
  appId: 620, activePlatform: "steam" as const, currentUser: user, accountProfile: noAccounts, steamUser: "",
  upsertOwnedGameInMemoryAndDb: vi.fn().mockResolvedValue(undefined), ...overrides,
});

describe("useGameDetails", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("rejects an invalid app id", async () => {
    const { result } = renderHook(() => useGameDetails(params({ appId: NaN })));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Identifiant de jeu invalide.");
  });

  it("loads details and saved progress, and refreshes the owned game", async () => {
    const owned = { appId: 620, name: "Portal 2", headerImg: "https://images.unsplash.com/x", platform: "steam", totalAchievements: 0, unlockedCount: 0, addedAt: "x" } as OwnedGame;
    server({ "/api/user/progress": { progress: { unlockedIds: ["a1"], notes: {} } }, "/api/game/620": details });
    const p = params({ owned });
    const { result } = renderHook(() => useGameDetails(p));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.game?.name).toBe("Portal 2");
    expect(result.current.progress.unlockedIds).toEqual(["a1"]);
    expect(p.upsertOwnedGameInMemoryAndDb).toHaveBeenCalledWith(expect.objectContaining({ headerImg: "https://cdn/p2.jpg", totalAchievements: 2, unlockedCount: 1 }));
  });

  it("prefers the unlocked ids returned with the details", async () => {
    server({ "/api/game/620": { ...details, unlockedIds: ["a1", "a2"] } });
    const { result } = renderHook(() => useGameDetails(params({ currentUser: null })));
    await waitFor(() => expect(result.current.progress.unlockedIds).toEqual(["a1", "a2"]));
  });

  it("refreshes progress for Epic games after loading the details", async () => {
    const fetchSpy = server({ "/api/user/progress": { progress: { unlockedIds: ["a2"], notes: {} } }, "/api/game/620": details });
    const { result } = renderHook(() => useGameDetails(params({ activePlatform: "epic" })));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchSpy.mock.calls.filter((c) => String(c[0]).startsWith("/api/user/progress"))).toHaveLength(2);
    expect(result.current.progress.unlockedIds).toEqual(["a2"]);
  });

  it("auto-syncs Steam achievements by title when nothing is unlocked yet", async () => {
    server({
      "/api/user/progress?": { progress: null },
      "/api/game/620": details,
      "/api/sync": { success: true, unlockedTitles: ["you monster"] },
      "/api/user/progress": { success: true },
    });
    const p = params({ steamUser: "gabe" });
    const { result } = renderHook(() => useGameDetails(p));

    await waitFor(() => expect(result.current.syncNotice?.msg).toBe("1 succès synchronisés automatiquement depuis Steam !"));
    expect(result.current.progress.unlockedIds).toEqual(["a2"]);
    expect(p.upsertOwnedGameInMemoryAndDb).toHaveBeenCalledWith(expect.objectContaining({ platform: "steam", unlockedCount: 1 }));
  });

  it("shows the loading error", async () => {
    server({ "/api/game/620": jsonResponse({}, 500) });
    const { result } = renderHook(() => useGameDetails(params({ currentUser: null })));
    await waitFor(() => expect(result.current.error).toBe("Impossible de récupérer les succès du jeu."));
  });
});
