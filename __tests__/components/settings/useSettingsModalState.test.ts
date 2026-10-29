// @vitest-environment jsdom
// __tests__/components/settings/useSettingsModalState.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSettingsModalState } from "@/components/settings/useSettingsModalState";
import { parseSyncPayload } from "@/components/settings/settingsBackupUtils";
import { jsonResponse } from "../../helpers/responses";

const { confirmMock } = vi.hoisted(() => ({ confirmMock: vi.fn() }));
vi.mock("@/components/ui/confirm/useConfirm", () => ({ useConfirm: () => confirmMock }));

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  initialSteamUser: "gabe",
  initialSteamApiKey: "key",
  onSteamUserSaved: vi.fn(),
  onRefreshData: vi.fn().mockResolvedValue(undefined),
  onDataReset: vi.fn(),
};
const syncData = { profile: { displayName: "Gabe" }, games: [{ appId: 1 }], steamApiKey: "k" };

function mockApi(overrides: Partial<Record<string, Response>> = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const key = `${init?.method || "GET"} ${String(input)}`;
    return overrides[key] ?? jsonResponse(key === "GET /api/user/sync" ? syncData : { success: true });
  });
}

describe("useSettingsModalState", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("starts from the initial Steam settings and saves them through the API", async () => {
    const fetchSpy = mockApi();
    const { result } = renderHook(() => useSettingsModalState(baseProps));
    expect(result.current.steamUser).toBe("gabe");

    act(() => { result.current.setSteamUser("  newuser "); result.current.setSteamApiKey(" newkey "); });
    await act(() => result.current.handleSaveSteamUser());

    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body).toMatchObject({ account: { platform: "steam", username: "newuser" }, plainApiKey: "newkey" });
    expect(baseProps.onSteamUserSaved).toHaveBeenCalledWith("newuser", "newkey");
    expect(baseProps.onRefreshData).toHaveBeenCalled();
    expect(result.current.steamSaved).toBe(true);
    expect(result.current.statusMsg?.type).toBe("success");
  });

  it("reports a failed Steam save", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useSettingsModalState(baseProps));
    await act(() => result.current.handleSaveSteamUser());
    expect(result.current.statusMsg?.type).toBe("error");
  });

  it("copies the export to the clipboard", async () => {
    mockApi();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { result } = renderHook(() => useSettingsModalState(baseProps));

    await act(() => result.current.handleExport());

    const exported = JSON.parse(writeText.mock.calls[0][0]);
    expect(exported).toMatchObject({ profile: syncData.profile, games: syncData.games, favorites: [] });
    expect(exported).not.toHaveProperty("steamApiKey");
    expect(result.current.copied).toBe(true);
  });

  it("reports export and download failures", async () => {
    mockApi({ "GET /api/user/sync": jsonResponse({}, 500) });
    const { result } = renderHook(() => useSettingsModalState(baseProps));
    await act(() => result.current.handleExport());
    expect(result.current.statusMsg?.text).toContain("exporter");
    await act(() => result.current.handleDownload());
    expect(result.current.statusMsg?.text).toContain("télécharger");
  });

  it("downloads the export as a dated JSON file", async () => {
    mockApi();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    const { result } = renderHook(() => useSettingsModalState(baseProps));

    await act(() => result.current.handleDownload());

    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:x");
    expect(result.current.statusMsg?.type).toBe("success");
  });

  it("imports pasted JSON, ignores empty input and rejects invalid JSON", async () => {
    const fetchSpy = mockApi();
    const { result } = renderHook(() => useSettingsModalState(baseProps));

    await act(() => result.current.handleImport());
    expect(fetchSpy).not.toHaveBeenCalled();

    act(() => result.current.setImportText(JSON.stringify({ games: [{ appId: 2 }] })));
    await act(() => result.current.handleImport());
    expect(fetchSpy).toHaveBeenCalledWith("/api/user/sync", expect.objectContaining({ method: "POST" }));
    expect(result.current.importText).toBe("");

    act(() => result.current.setImportText("{not json"));
    await act(() => result.current.handleImport());
    expect(result.current.statusMsg?.type).toBe("error");
  });

  it("clears all data only after confirmation", async () => {
    const fetchSpy = mockApi();
    confirmMock.mockReset().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const { result } = renderHook(() => useSettingsModalState(baseProps));

    await act(() => result.current.handleClearAll());
    expect(fetchSpy).not.toHaveBeenCalled();

    await act(() => result.current.handleClearAll());
    expect(fetchSpy).toHaveBeenCalledWith("/api/user/games?all=true", { method: "DELETE" });
    expect(baseProps.onDataReset).toHaveBeenCalled();
    expect(confirmMock).toHaveBeenCalledTimes(2);
    expect(confirmMock).toHaveBeenCalledWith(expect.objectContaining({ confirmLabel: "Tout supprimer" }));
  });
});

describe("parseSyncPayload", () => {
  it("keeps the server format and converts the legacy localStorage export", () => {
    expect(parseSyncPayload('{"games":[1]}')).toEqual({ games: [1] });
    expect(parseSyncPayload(JSON.stringify({
      trophyhunter_owned_games_v1: [{ appId: 3 }],
      trophyhunter_favorites: [3],
      trophyhunter_game_3: { unlockedIds: ["x"] },
    }))).toMatchObject({ games: [{ appId: 3 }], favorites: [3], progress: { trophyhunter_game_3: { unlockedIds: ["x"] } } });
  });
});
