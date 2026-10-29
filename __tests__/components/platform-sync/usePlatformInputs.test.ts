// @vitest-environment jsdom
// __tests__/components/dashboard/usePlatformInputs.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePlatformInputs } from "@/components/platform-sync/hooks/usePlatformInputs";
import type { UserAccountProfile } from "@/lib/types";

const account = (platform: string, username: string) => ({
  platform, username, connectedAt: "x", stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 },
});

describe("usePlatformInputs", () => {
  beforeEach(() => localStorage.clear());

  it("prefills each input from the connected accounts and the saved Steam key", () => {
    const profile = {
      displayName: "P",
      accounts: { steam: account("steam", "s"), xbox: account("xbox", "x"), epic: account("epic", "e"), gog: account("gog", "g") },
    } as UserAccountProfile;
    const { result } = renderHook(() => usePlatformInputs({ accountProfile: profile, initialSteamApiKey: "key" }));

    expect(result.current).toMatchObject({ steamInput: "s", xboxInput: "x", epicInput: "e", gogInput: "g", steamApiKey: "key" });
  });

  it("fills inputs once accounts arrive later", () => {
    let profile: UserAccountProfile = { displayName: "P", accounts: {} };
    const { result, rerender } = renderHook(() => usePlatformInputs({ accountProfile: profile, initialSteamApiKey: "" }));
    expect(result.current.steamInput).toBe("");

    profile = { displayName: "P", accounts: { steam: account("steam", "late"), gog: account("gog", "g2") } } as UserAccountProfile;
    rerender();
    expect(result.current.steamInput).toBe("late");
    expect(result.current.gogInput).toBe("g2");
  });

  it("keeps the Xbox API key in memory only, out of browser storage", () => {
    const profile: UserAccountProfile = { displayName: "P", accounts: {} };
    const { result } = renderHook(() => usePlatformInputs({ accountProfile: profile }));

    act(() => result.current.setXboxApiKey("xkey"));
    expect(result.current.xboxApiKey).toBe("xkey");
    expect(localStorage.length).toBe(0);
  });

  it("removes an Xbox API key left in browser storage by an earlier version", () => {
    localStorage.setItem("trophyhunter_xbox_api_key", "leaked");
    const { result } = renderHook(() => usePlatformInputs({ accountProfile: { displayName: "P", accounts: {} } }));

    expect(result.current.xboxApiKey).toBe("");
    expect(localStorage.getItem("trophyhunter_xbox_api_key")).toBeNull();
  });

  it("stores the secrets typed in the connection panel", () => {
    const { result } = renderHook(() => usePlatformInputs({ accountProfile: { displayName: "P", accounts: {} } }));
    act(() => {
      result.current.setEpicCode("code");
      result.current.setGogToken("tok");
    });
    expect(result.current).toMatchObject({ epicCode: "code", gogToken: "tok" });
  });
});
