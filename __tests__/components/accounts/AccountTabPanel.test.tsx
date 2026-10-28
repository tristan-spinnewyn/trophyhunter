// __tests__/components/accounts/AccountTabPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { DashboardSectionProps } from "@/components/accounts/hooks/useAccountDashboardController";
import type { PlatformConnectionPanelProps } from "@/components/accounts/PlatformConnectionPanel";

const received: Record<string, Record<string, unknown>> = {};

vi.mock("@/components/accounts/OverviewPanel", () => ({
  default: (props: Record<string, unknown>) => {
    received.overview = props;
    return null;
  },
}));
vi.mock("@/components/accounts/PlatformConnectionPanel", () => ({
  PlatformConnectionPanel: (props: PlatformConnectionPanelProps) => {
    received[props.platform] = props as unknown as Record<string, unknown>;
    return null;
  },
}));

const { default: AccountTabPanel } = await import("@/components/accounts/AccountTabPanel");

const fn = (name: string) => Object.assign(vi.fn(), { mockName: name });

function makeSection(activePlatformTab: string) {
  const handleCleanEpicGames = vi.fn();
  const controller = {
    activePlatformTab,
    handleSelectTab: vi.fn(),
    stats: {
      platformCounts: { steam: 3, xbox: 1, epic: 5, gog: 0 },
      epicCounts: { total: 5, withAch: 2, noAch: 3 },
    },
    platformInputs: {
      steamInput: "gabe", setSteamInput: fn("setSteamInput"),
      steamApiKey: "key", setSteamApiKey: fn("setSteamApiKey"),
      xboxInput: "chief", setXboxInput: fn("setXboxInput"),
      xboxApiKey: "xkey", setXboxApiKey: fn("setXboxApiKey"),
      epicInput: "epicuser", setEpicInput: fn("setEpicInput"),
      epicCode: "code", setEpicCode: fn("setEpicCode"),
      gogInput: "goguser", setGogInput: fn("setGogInput"),
      gogToken: "tok", setGogToken: fn("setGogToken"),
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
  return { section, controller, props, handleCleanEpicGames };
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

  it("renders the same connection panel for every platform, with the shared account actions", () => {
    for (const platform of ["steam", "xbox", "epic", "gog"]) {
      const { controller: c } = render(platform);
      expect(received[platform]).toMatchObject({
        platform,
        syncProgressText: "50%",
        onEdit: c.platformSync.openEditPlatform,
        onDisconnect: c.platformSync.handleDisconnectPlatform,
      });
    }
  });

  it("wires Steam to its identifier, API key, sync state and account", () => {
    const { controller: c, props } = render("steam");

    expect(received.steam).toMatchObject({
      account: props.accountProfile.accounts.steam,
      gameCount: 3,
      identifier: "gabe", onIdentifierChange: c.platformInputs.setSteamInput,
      secret: "key", onSecretChange: c.platformInputs.setSteamApiKey,
      isSyncing: true,
    });
    (received.steam.onSync as () => void)();
    expect(c.platformSync.handleConnectAndSyncSteam).toHaveBeenCalledWith();
  });

  it("wires Xbox and GOG to their own inputs", () => {
    const xbox = render("xbox");
    expect(received.xbox).toMatchObject({
      account: undefined, gameCount: 1,
      identifier: "chief", onIdentifierChange: xbox.controller.platformInputs.setXboxInput,
      secret: "xkey", onSecretChange: xbox.controller.platformInputs.setXboxApiKey,
      isSyncing: false,
    });

    const gog = render("gog");
    expect(received.gog).toMatchObject({
      gameCount: 0,
      identifier: "goguser", onIdentifierChange: gog.controller.platformInputs.setGogInput,
      secret: "tok", onSecretChange: gog.controller.platformInputs.setGogToken,
    });
    (received.gog.onSync as () => void)();
    expect(gog.controller.platformSync.handleConnectAndSyncGOG).toHaveBeenCalled();
  });

  it("gives Epic its guided authorization and keeps the Epic library tools", () => {
    const { controller: c, handleCleanEpicGames } = render("epic");

    expect(received.epic).toMatchObject({
      gameCount: 5,
      identifier: "epicuser", onIdentifierChange: c.platformInputs.setEpicInput,
      secret: "code", onSecretChange: c.platformInputs.setEpicCode,
      isSyncing: true,
      onOpenGuidedAuth: c.platformSync.openEpicAuthModalForLibrary,
    });
    expect(received.epic.extra).toBeTruthy();

    const tools = received.epic.extra as { props: { onCleanEpicGames: () => void; epicCounts: unknown } };
    expect(tools.props.epicCounts).toEqual(c.stats.epicCounts);
    tools.props.onCleanEpicGames();
    expect(handleCleanEpicGames).toHaveBeenCalledWith(3, 2);
  });
});
