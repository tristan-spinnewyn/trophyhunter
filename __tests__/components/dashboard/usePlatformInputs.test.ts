// @vitest-environment jsdom
// __tests__/components/dashboard/usePlatformInputs.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePlatformInputs } from "@/components/dashboard/hooks/usePlatformInputs";
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

  it("remembers the Xbox API key locally and forgets it when cleared", () => {
    const profile: UserAccountProfile = { displayName: "P", accounts: {} };
    const { result } = renderHook(() => usePlatformInputs({ accountProfile: profile }));

    act(() => result.current.setXboxApiKey("  xkey "));
    expect(localStorage.getItem("trophyhunter_xbox_api_key")).toBe("xkey");
    expect(renderHook(() => usePlatformInputs({ accountProfile: profile })).result.current.xboxApiKey).toBe("xkey");

    act(() => result.current.setXboxApiKey(""));
    expect(localStorage.getItem("trophyhunter_xbox_api_key")).toBeNull();
  });

  it("toggles the secret fields", () => {
    const { result } = renderHook(() => usePlatformInputs({ accountProfile: { displayName: "P", accounts: {} } }));
    act(() => {
      result.current.setShowApiKeyInput(true);
      result.current.setShowEpicCode(true);
      result.current.setEpicCode("code");
      result.current.setGogToken("tok");
    });
    expect(result.current).toMatchObject({ showApiKeyInput: true, showEpicCode: true, epicCode: "code", gogToken: "tok" });
  });
});
