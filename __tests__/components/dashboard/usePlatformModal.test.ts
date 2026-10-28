// @vitest-environment jsdom
// __tests__/components/dashboard/usePlatformModal.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePlatformModal } from "@/components/dashboard/hooks/usePlatformModal";
import type { UserAccountProfile } from "@/lib/types";

const steamAccount = {
  platform: "steam",
  username: "gabe",
  connectedAt: "x",
  stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 },
};

function setup() {
  const profile = { displayName: "P", accounts: { steam: steamAccount } } as UserAccountProfile;
  const deps = {
    accountProfile: profile,
    onAccountChange: vi.fn(),
    onSteamUserChange: vi.fn(),
    setSteamInput: vi.fn(),
    setBannerMsg: vi.fn(),
    updateAccountProfileInMemory: vi.fn(),
    persistAccount: vi.fn().mockResolvedValue(undefined),
    removeAccount: vi.fn().mockResolvedValue(undefined),
    handleConnectAndSyncSteam: vi.fn().mockResolvedValue(undefined),
  };
  const { result } = renderHook(() => usePlatformModal(deps));
  return { result, deps };
}

describe("usePlatformModal.handleDisconnectPlatform", () => {
  afterEach(() => vi.restoreAllMocks());

  it("asks for confirmation naming the platform before unlinking", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { result } = setup();

    await act(() => result.current.handleDisconnectPlatform("steam"));

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining("Steam"));
  });

  it("unlinks the account once confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { result, deps } = setup();

    await act(() => result.current.handleDisconnectPlatform("steam"));

    expect(deps.onAccountChange).toHaveBeenCalledWith({ displayName: "P", accounts: {} });
    expect(deps.removeAccount).toHaveBeenCalledWith("steam");
    expect(deps.onSteamUserChange).toHaveBeenCalledWith("");
  });

  it("keeps the account when the user cancels", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const { result, deps } = setup();

    await act(() => result.current.handleDisconnectPlatform("steam"));

    expect(deps.onAccountChange).not.toHaveBeenCalled();
    expect(deps.removeAccount).not.toHaveBeenCalled();
  });
});
