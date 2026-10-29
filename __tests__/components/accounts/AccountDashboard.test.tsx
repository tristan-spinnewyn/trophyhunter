// @vitest-environment jsdom
// __tests__/components/accounts/AccountDashboard.test.tsx
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AccountDashboardControllerParams } from "@/components/accounts/hooks/useAccountDashboardController";
import type { PlatformAccount } from "@/lib/types";

type Controller = Record<string, unknown> & {
  platformSync: Record<string, unknown>;
  platformInputs: Record<string, unknown>;
};

let controller: Controller;

vi.mock("@/components/accounts/hooks/useAccountDashboardController", () => ({
  useAccountDashboardController: () => controller,
}));

const { default: AccountDashboard } = await import("@/components/accounts/AccountDashboard");

const steamAccount = {
  platform: "steam",
  username: "gabe",
  displayName: "Gabe N.",
  connectedAt: "2026-01-01T00:00:00.000Z",
  level: 42,
  stats: { gamesOwned: 40, totalAchievements: 900, completedGames: 7 },
  rareShowcase: [
    { appId: 620, gameName: "Portal 2", achievementName: "Still Alive", percent: 0.4, icon: "https://example.test/a.jpg" },
  ],
} as PlatformAccount;

const xboxAccount = {
  platform: "xbox",
  username: "chief",
  displayName: "Master Chief",
  connectedAt: "2026-01-01T00:00:00.000Z",
  stats: { gamesOwned: 1, totalAchievements: 30, completedGames: 0, gamerScore: 12500 },
} as PlatformAccount;

function makeController(activePlatformTab = "all"): Controller {
  return {
    bannerMsg: null,
    setBannerMsg: vi.fn(),
    activePlatformTab,
    handleSelectTab: vi.fn(),
    stats: {
      platformCounts: { steam: 3, xbox: 1, epic: 5, gog: 0 },
      epicCounts: { total: 5, withAch: 2, noAch: 3 },
    },
    platformInputs: {
      steamInput: "gabe", setSteamInput: vi.fn(), steamApiKey: "", setSteamApiKey: vi.fn(),
      xboxInput: "chief", setXboxInput: vi.fn(), xboxApiKey: "", setXboxApiKey: vi.fn(),
      epicInput: "", setEpicInput: vi.fn(), epicCode: "", setEpicCode: vi.fn(),
      gogInput: "goguser", setGogInput: vi.fn(), gogToken: "", setGogToken: vi.fn(),
    },
    platformSync: {
      openEditPlatform: vi.fn(),
      handleDisconnectPlatform: vi.fn(),
      isSyncingSteam: false, isSyncingXbox: false, isSyncingEpic: false, isSyncingGOG: false,
      syncProgressText: null,
      handleConnectAndSyncSteam: vi.fn(),
      handleConnectAndSyncXbox: vi.fn(),
      handleConnectAndSyncEpic: vi.fn(),
      handleConnectAndSyncGOG: vi.fn(),
      handleScanEpicAchievements: vi.fn(),
      handleCleanEpicGames: vi.fn(),
      openEpicAuthModalForLibrary: vi.fn(),
      editingPlatform: null,
      setEditingPlatform: vi.fn(),
      platForm: { username: "", level: "", gamesOwned: "", totalAchievements: "", completedGames: "", gamerScore: "" },
      setPlatForm: vi.fn(),
      handleSavePlatformModal: vi.fn(),
      isEpicAuthModalOpen: false,
      closeEpicAuthModal: vi.fn(),
      handleEpicModalSubmit: vi.fn(),
      epicAuthModalGame: null,
      isEpicModalSyncing: false,
      epicAuthModalError: null,
    },
  };
}

function renderDashboard() {
  const props = {
    accountProfile: { displayName: "Gabe", accounts: { steam: steamAccount, xbox: xboxAccount } },
    ownedGames: [],
    onAccountChange: vi.fn(),
    onOwnedGamesChange: vi.fn(),
    onSelectGame: vi.fn(),
    onSteamUserChange: vi.fn(),
  } as unknown as AccountDashboardControllerParams;
  render(<AccountDashboard {...props} />);
  return props;
}

describe("AccountDashboard", () => {
  beforeEach(() => {
    controller = makeController();
  });
  afterEach(cleanup);

  it("shows every platform on the overview, linked or not", () => {
    renderDashboard();

    expect(screen.getByRole("heading", { name: "Mes plateformes" })).toBeTruthy();
    expect(screen.getByText("Gabe N.")).toBeTruthy();
    expect(screen.getByText("Niv. 42")).toBeTruthy();
    expect(screen.getByText("12 500 G")).toBeTruthy();
    expect(screen.getByText("3 jeux")).toBeTruthy();
    expect(screen.getByText("1 jeu")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Lier le compte/ })).toHaveLength(2);
  });

  it("opens, edits and disconnects platforms from their overview cards", () => {
    renderDashboard();
    const ps = controller.platformSync;

    fireEvent.click(screen.getAllByRole("button", { name: /Ouvrir/ })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Modifier les statistiques ou l'identifiant" })[1]);
    fireEvent.click(screen.getAllByRole("button", { name: "Délier ce compte" })[0]);

    expect(controller.handleSelectTab).toHaveBeenCalledWith("steam");
    expect(ps.openEditPlatform).toHaveBeenCalledWith("xbox");
    expect(ps.handleDisconnectPlatform).toHaveBeenCalledWith("steam");
  });

  it("opens a game from the rare achievements showcase", () => {
    const props = renderDashboard();

    expect(screen.getByText("Ultra Rare • 0.4% des joueurs")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Still Alive/ }));

    expect(props.onSelectGame).toHaveBeenCalledWith(620);
  });

  it("switches between the overview and the platform tabs", () => {
    controller = makeController("xbox");
    renderDashboard();

    const nav = screen.getByRole("navigation", { name: "Plateformes" });
    fireEvent.click(nav.querySelector("button")!);
    fireEvent.click(screen.getByRole("button", { name: /^GOG/ }));

    expect(controller.handleSelectTab).toHaveBeenNthCalledWith(1, "all");
    expect(controller.handleSelectTab).toHaveBeenNthCalledWith(2, "gog");
  });

  it("syncs the platform shown in its tab", () => {
    const cases = [
      ["steam", "Synchroniser", "handleConnectAndSyncSteam"],
      ["xbox", "Synchroniser", "handleConnectAndSyncXbox"],
      ["epic", "Importer", "handleConnectAndSyncEpic"],
      ["gog", "Importer", "handleConnectAndSyncGOG"],
    ] as const;
    for (const [platform, label, handler] of cases) {
      controller = makeController(platform);
      renderDashboard();

      fireEvent.click(screen.getByRole("button", { name: label }));

      expect(controller.platformSync[handler]).toHaveBeenCalled();
      cleanup();
    }
  });

  it("adds the Epic library tools and guided authorization on the Epic tab", () => {
    controller = makeController("epic");
    renderDashboard();
    const ps = controller.platformSync;

    fireEvent.click(screen.getByRole("button", { name: "Nettoyer les jeux Epic" }));
    fireEvent.click(screen.getByRole("button", { name: "Me guider pas à pas" }));

    expect(ps.handleCleanEpicGames).toHaveBeenCalledWith(3, 2);
    expect(ps.openEpicAuthModalForLibrary).toHaveBeenCalled();
  });

  it("renders no panel for an unknown tab", () => {
    controller = makeController("wishlist");
    renderDashboard();

    expect(screen.queryByRole("heading", { name: "Mes plateformes" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Importer" })).toBeNull();
  });

  it("shows and dismisses the feedback banner", () => {
    controller = { ...makeController(), bannerMsg: { type: "error", text: "Profil privé" } };
    renderDashboard();

    expect(screen.getByRole("alert").textContent).toContain("Profil privé");
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));

    expect(controller.setBannerMsg).toHaveBeenCalledWith(null);
  });

  it("closes the edit dialog", () => {
    controller = makeController();
    controller.platformSync.editingPlatform = "gog";
    renderDashboard();

    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(controller.platformSync.setEditingPlatform).toHaveBeenCalledWith(null);
  });
});
