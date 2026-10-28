// __tests__/components/accounts/AccountTabPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { DashboardSectionProps } from "@/components/accounts/hooks/useAccountDashboardController";

const received: Record<string, Record<string, unknown>> = {};
const panel = (name: string) => ({
  default: (props: Record<string, unknown>) => {
    received[name] = props;
    return null;
  },
});

vi.mock("@/components/accounts/OverviewPanel", () => panel("overview"));
vi.mock("@/components/accounts/PlatformSteamPanel", () => panel("steam"));
vi.mock("@/components/accounts/PlatformXboxPanel", () => panel("xbox"));
vi.mock("@/components/accounts/PlatformEpicPanel", () => panel("epic"));
vi.mock("@/components/accounts/PlatformGogPanel", () => panel("gog"));

const { default: AccountTabPanel } = await import("@/components/accounts/AccountTabPanel");

const fn = (name: string) => Object.assign(vi.fn(), { mockName: name });

function makeSection(activePlatformTab: string) {
  const handleSelectTab = vi.fn();
  const handleCleanEpicGames = vi.fn();
  const controller = {
    activePlatformTab,
    handleSelectTab,
    displayName: "Gabe",
    stats: {
      platformCounts: { steam: 3, xbox: 1, epic: 5, gog: 0 },
      epicCounts: { total: 5, withAch: 2, noAch: 3 },
    },
    platformInputs: {
      steamInput: "gabe", setSteamInput: fn("setSteamInput"),
      steamApiKey: "key", setSteamApiKey: fn("setSteamApiKey"),
      showApiKeyInput: true, setShowApiKeyInput: fn("setShowApiKeyInput"),
      xboxInput: "chief", setXboxInput: fn("setXboxInput"),
      xboxApiKey: "xkey", setXboxApiKey: fn("setXboxApiKey"),
      showXboxApiKey: false, setShowXboxApiKey: fn("setShowXboxApiKey"),
      epicInput: "epicuser", setEpicInput: fn("setEpicInput"),
      epicCode: "code", setEpicCode: fn("setEpicCode"),
      showEpicCode: true, setShowEpicCode: fn("setShowEpicCode"),
      gogInput: "goguser", setGogInput: fn("setGogInput"),
      gogToken: "tok", setGogToken: fn("setGogToken"),
      showGogToken: false, setShowGogToken: fn("setShowGogToken"),
    },
    platformSync: {
      openEditPlatform: fn("openEditPlatform"),
      handleDisconnectPlatform: fn("disconnect"),
      isSyncingSteam: true, isSyncingXbox: false, isSyncingEpic: true, isSyncingGOG: false,
      syncProgressText: "50%",
      handleConnectAndSyncSteam: fn("syncSteam"),
      handleConnectAndSyncXbox: fn("syncXbox"),
      handleConnectAndSyncEpic: fn("syncEpic"),
      handleScanEpicAchievements: fn("scanEpic"),
      handleCleanEpicGames,
      openEpicAuthModalForLibrary: fn("openEpicModal"),
      handleConnectAndSyncGOG: fn("syncGog"),
    },
  };
  const props = {
    accountProfile: { displayName: "Gabe", accounts: { steam: { platform: "steam", username: "gabe" } } },
    ownedGames: [{ appId: 1 }],
    onSelectGame: fn("selectGame"),
  };
  const section = { controller, props } as unknown as DashboardSectionProps;
  return { section, controller, props, handleSelectTab, handleCleanEpicGames };
}

function render(tab: string) {
  const ctx = makeSection(tab);
  renderToStaticMarkup(<AccountTabPanel {...ctx.section} />);
  return ctx;
}

describe("AccountTabPanel", () => {
  beforeEach(() => {
    for (const k of Object.keys(received)) delete received[k];
  });

  it("renders only the overview on the 'all' tab, wired to stats and platform actions", () => {
    const { controller: c, props } = render("all");

    expect(Object.keys(received)).toEqual(["overview"]);
    expect(received.overview).toEqual({
      accountProfile: props.accountProfile,
      platformCounts: c.stats.platformCounts,
      onSelectPlatform: c.handleSelectTab,
      onEditPlatform: c.platformSync.openEditPlatform,
      onDisconnectPlatform: c.platformSync.handleDisconnectPlatform,
      onSelectGame: props.onSelectGame,
    });
  });

  it("only knows the overview and the platform panels: library views live on the home page", () => {
    for (const tab of ["gamepass", "duplicates", "collections", "wishlist"]) {
      for (const k of Object.keys(received)) delete received[k];
      render(tab);
      expect(Object.keys(received)).toEqual([]);
    }
  });

  it("wires the Steam panel to the Steam inputs and sync state", () => {
    const { controller: c, props } = render("steam");
    const pi = c.platformInputs;

    expect(received.steam).toMatchObject({
      steamAccount: props.accountProfile.accounts.steam,
      displayName: "Gabe",
      platformCounts: c.stats.platformCounts,
      steamInput: pi.steamInput, setSteamInput: pi.setSteamInput,
      steamApiKey: pi.steamApiKey, setSteamApiKey: pi.setSteamApiKey,
      showApiKeyInput: pi.showApiKeyInput, setShowApiKeyInput: pi.setShowApiKeyInput,
      isSyncingSteam: true, syncProgressText: "50%",
      onConnectAndSyncSteam: c.platformSync.handleConnectAndSyncSteam,
      gameCount: 3,
    });
  });

  it("wires the Xbox and GOG panels to their own inputs", () => {
    const xbox = render("xbox");
    expect(received.xbox).toMatchObject({
      xboxInput: "chief", xboxApiKey: "xkey", showXboxApiKey: false, isSyncingXbox: false,
      setXboxInput: xbox.controller.platformInputs.setXboxInput,
      onConnectAndSyncXbox: xbox.controller.platformSync.handleConnectAndSyncXbox,
      openEditPlatform: xbox.controller.platformSync.openEditPlatform,
      gameCount: 1,
    });

    const gog = render("gog");
    expect(received.gog).toMatchObject({
      gogInput: "goguser", gogToken: "tok", showGogToken: false, isSyncingGOG: false,
      setGogToken: gog.controller.platformInputs.setGogToken,
      onConnectAndSyncGOG: gog.controller.platformSync.handleConnectAndSyncGOG,
      gameCount: 0,
    });
  });

  it("wires the Epic panel and passes the Epic counts to the cleanup action", () => {
    const { controller: c, handleCleanEpicGames } = render("epic");

    expect(received.epic).toMatchObject({
      epicCounts: c.stats.epicCounts,
      epicInput: "epicuser", epicCode: "code", showEpicCode: true, isSyncingEpic: true,
      gameCount: 5,
      onConnectAndSyncEpic: c.platformSync.handleConnectAndSyncEpic,
      onScanEpicAchievements: c.platformSync.handleScanEpicAchievements,
      onOpenEpicModal: c.platformSync.openEpicAuthModalForLibrary,
    });
    (received.epic.onCleanEpicGames as () => void)();
    expect(handleCleanEpicGames).toHaveBeenCalledWith(3, 2);
  });
});
