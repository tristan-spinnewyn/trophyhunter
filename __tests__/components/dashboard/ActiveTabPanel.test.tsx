// __tests__/components/dashboard/ActiveTabPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { DashboardSectionProps } from "@/components/dashboard/hooks/useAccountDashboardController";

const received: Record<string, Record<string, unknown>> = {};
const panel = (name: string) => ({
  default: (props: Record<string, unknown>) => {
    received[name] = props;
    return null;
  },
});

vi.mock("@/components/dashboard/OverviewPanel", () => panel("overview"));
vi.mock("@/components/dashboard/GamePassPanel", () => panel("gamepass"));
vi.mock("@/components/dashboard/DuplicatesPanel", () => panel("duplicates"));
vi.mock("@/components/dashboard/CollectionsPanel", () => panel("collections"));
vi.mock("@/components/dashboard/PlatformSteamPanel", () => panel("steam"));
vi.mock("@/components/dashboard/PlatformXboxPanel", () => panel("xbox"));
vi.mock("@/components/dashboard/PlatformEpicPanel", () => panel("epic"));
vi.mock("@/components/dashboard/PlatformGogPanel", () => panel("gog"));

const { default: ActiveTabPanel } = await import("@/components/dashboard/ActiveTabPanel");

const fn = (name: string) => Object.assign(vi.fn(), { mockName: name });

function makeSection(activePlatformTab: string) {
  const handleSelectTab = vi.fn();
  const handleCleanEpicGames = vi.fn();
  const controller = {
    activePlatformTab,
    handleSelectTab,
    handleAddGamePassToXbox: fn("addGamePass"),
    displayName: "Gabe",
    stats: {
      globalStats: { connectedCount: 2 },
      platformCounts: { steam: 3 },
      duplicateGroups: [{ title: "Portal", games: [] }],
      epicCounts: { total: 5, withAch: 2, noAch: 3 },
    },
    collectionsState: {
      wishlistIds: [7],
      handleToggleWishlist: fn("toggleWishlist"),
      collections: [{ id: "c1", name: "RPG", gameIds: [] }],
      selectedCollId: "c1",
      setSelectedCollId: fn("setSelectedCollId"),
      isCreatingColl: false,
      setIsCreatingColl: fn("setIsCreatingColl"),
      newCollName: "New",
      setNewCollName: fn("setNewCollName"),
      newCollDesc: "Desc",
      setNewCollDesc: fn("setNewCollDesc"),
      handleCreateCollection: fn("createCollection"),
      handleDeleteCollection: fn("deleteCollection"),
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
    libraryFilters: { libAchievementFilter: "all", setLibAchievementFilter: fn("setAchFilter") },
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
  renderToStaticMarkup(<ActiveTabPanel {...ctx.section} />);
  return ctx;
}

describe("ActiveTabPanel", () => {
  beforeEach(() => {
    for (const k of Object.keys(received)) delete received[k];
  });

  it("renders only the overview on the 'all' tab, wired to stats and platform actions", () => {
    const { controller: c, props } = render("all");

    expect(Object.keys(received)).toEqual(["overview"]);
    expect(received.overview).toEqual({
      globalStats: c.stats.globalStats,
      accountProfile: props.accountProfile,
      platformCounts: c.stats.platformCounts,
      onSelectPlatform: c.handleSelectTab,
      onEditPlatform: c.platformSync.openEditPlatform,
      onDisconnectPlatform: c.platformSync.handleDisconnectPlatform,
      onSelectGame: props.onSelectGame,
    });
  });

  it("wires the Game Pass panel and its back and select callbacks", () => {
    const { controller: c, props, handleSelectTab } = render("gamepass");

    expect(received.gamepass).toMatchObject({
      ownedGames: props.ownedGames,
      wishlistIds: c.collectionsState.wishlistIds,
      onAddGameToXbox: c.handleAddGamePassToXbox,
      onToggleWishlist: c.collectionsState.handleToggleWishlist,
    });
    (received.gamepass.onSelectGame as (id: number) => void)(42);
    expect(props.onSelectGame).toHaveBeenCalledWith(42);
    (received.gamepass.onBackToAll as () => void)();
    expect(handleSelectTab).toHaveBeenCalledWith("all");
  });

  it("wires the duplicates and collections panels", () => {
    const dup = render("duplicates");
    expect(received.duplicates).toMatchObject({
      duplicateGroups: dup.controller.stats.duplicateGroups,
      onSelectGame: dup.props.onSelectGame,
    });

    const { controller: c } = render("collections");
    const { wishlistIds, handleToggleWishlist, ...collectionProps } = c.collectionsState;
    void wishlistIds; void handleToggleWishlist;
    expect(received.collections).toMatchObject(collectionProps);
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
    });
  });

  it("wires the Xbox and GOG panels to their own inputs", () => {
    const xbox = render("xbox");
    expect(received.xbox).toMatchObject({
      xboxInput: "chief", xboxApiKey: "xkey", showXboxApiKey: false, isSyncingXbox: false,
      setXboxInput: xbox.controller.platformInputs.setXboxInput,
      onConnectAndSyncXbox: xbox.controller.platformSync.handleConnectAndSyncXbox,
      openEditPlatform: xbox.controller.platformSync.openEditPlatform,
    });

    const gog = render("gog");
    expect(received.gog).toMatchObject({
      gogInput: "goguser", gogToken: "tok", showGogToken: false, isSyncingGOG: false,
      setGogToken: gog.controller.platformInputs.setGogToken,
      onConnectAndSyncGOG: gog.controller.platformSync.handleConnectAndSyncGOG,
    });
  });

  it("wires the Epic panel and passes the Epic counts to the cleanup action", () => {
    const { controller: c, handleCleanEpicGames } = render("epic");

    expect(received.epic).toMatchObject({
      epicCounts: c.stats.epicCounts,
      epicInput: "epicuser", epicCode: "code", showEpicCode: true, isSyncingEpic: true,
      libAchievementFilter: "all",
      setLibAchievementFilter: c.libraryFilters.setLibAchievementFilter,
      onConnectAndSyncEpic: c.platformSync.handleConnectAndSyncEpic,
      onScanEpicAchievements: c.platformSync.handleScanEpicAchievements,
      onOpenEpicModal: c.platformSync.openEpicAuthModalForLibrary,
    });
    (received.epic.onCleanEpicGames as () => void)();
    expect(handleCleanEpicGames).toHaveBeenCalledWith(3, 2);
  });
});
