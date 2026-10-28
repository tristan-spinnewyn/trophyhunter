// @vitest-environment jsdom
// __tests__/components/library/section/LibrarySection.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import LibrarySection, { type LibrarySectionProps } from "@/components/library/section/LibrarySection";
import { ConfirmProvider } from "@/components/ui/confirm/ConfirmProvider";
import { makeOwnedGame } from "../../../helpers/gameFixtures";

type SteamAccount = LibrarySectionProps["steamAccount"];

function renderSection(overrides: Partial<LibrarySectionProps> = {}) {
  const props: LibrarySectionProps = {
    activePlatformTab: "all",
    filteredGames: [makeOwnedGame()],
    totalOwnedGamesCount: 1,
    platformGameCount: 1,
    onOpenAddGame: vi.fn(),
    onAddApiKeyClick: vi.fn(),
    libSearch: "",
    setLibSearch: vi.fn(),
    libPlatformFilter: "all",
    setLibPlatformFilter: vi.fn(),
    libAchievementFilter: "all",
    setLibAchievementFilter: vi.fn(),
    libSortOrder: "recent-activity",
    setLibSortOrder: vi.fn(),
    selectedCollId: null,
    wishlistIds: [],
    collections: [],
    onSelectGame: vi.fn(),
    onToggleWishlist: vi.fn(),
    onOpenAddToCollection: vi.fn(),
    onRemoveFromCollection: vi.fn(),
    onSyncGame: vi.fn(),
    onRemoveGame: vi.fn(),
    ...overrides,
  };
  render(
    <ConfirmProvider>
      <LibrarySection {...props} />
    </ConfirmProvider>
  );
  return props;
}

function heading() {
  return screen.getByRole("heading", { level: 2 }).textContent;
}

describe("LibrarySection", () => {
  afterEach(cleanup);

  it("lists the games grouped by status", () => {
    renderSection({
      filteredGames: [makeOwnedGame(), makeOwnedGame({ appId: 400, name: "Portal", status: "completed" })],
      totalOwnedGamesCount: 2,
    });

    expect(screen.getByText("Portal 2")).toBeTruthy();
    expect(screen.getByText("Portal")).toBeTruthy();
    expect(document.querySelectorAll("details").length).toBe(2);
  });

  it("shows placeholder cards while loading", () => {
    renderSection({ isLoading: true });

    expect(screen.getByRole("status", { name: "Chargement de ta collection" })).toBeTruthy();
    expect(screen.queryByText("Portal 2")).toBeNull();
  });

  it("tells the user when the filters hide every game", () => {
    renderSection({ filteredGames: [], totalOwnedGamesCount: 3 });

    expect(screen.getByText("Aucun jeu ne correspond à ces filtres.")).toBeTruthy();
  });

  it("invites the user to link an account or add a game when the collection is empty", () => {
    const props = renderSection({ filteredGames: [], totalOwnedGamesCount: 0 });

    expect(screen.getByRole("link", { name: "Lier un compte" }).getAttribute("href")).toBe("/account");
    fireEvent.click(screen.getByRole("button", { name: "Ajouter un jeu" }));
    expect(props.onOpenAddGame).toHaveBeenCalled();
  });

  it("titles the section after the active tab", () => {
    const cases: [Partial<LibrarySectionProps>, string][] = [
      [{ activePlatformTab: "all", totalOwnedGamesCount: 5 }, "Tous mes jeux (1 / 5)"],
      [{ activePlatformTab: "gamepass" }, "Tous mes jeux (1)"],
      [{ activePlatformTab: "wishlist" }, "Ma liste d'envies (1)"],
      [{ activePlatformTab: "collections" }, "Jeux de la collection (1)"],
      [{ activePlatformTab: "duplicates" }, "Jeux en doublon (1)"],
      [{ activePlatformTab: "steam", platformGameCount: 4 }, "Mes jeux Steam (1 / 4)"],
      [{ activePlatformTab: "steam" }, "Mes jeux Steam (1)"],
    ];
    for (const [overrides, title] of cases) {
      renderSection(overrides);
      expect(heading()).toBe(title);
      cleanup();
    }
  });

  it("forwards search, platform, achievement and sort filter changes", () => {
    const props = renderSection();

    fireEvent.change(screen.getByRole("textbox", { name: "Filtrer mes jeux" }), { target: { value: "port" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Plateforme" }), { target: { value: "xbox" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Succès" }), { target: { value: "no-achievements" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Tri" }), { target: { value: "name-asc" } });

    expect(props.setLibSearch).toHaveBeenCalledWith("port");
    expect(props.setLibPlatformFilter).toHaveBeenCalledWith("xbox");
    expect(props.setLibAchievementFilter).toHaveBeenCalledWith("no-achievements");
    expect(props.setLibSortOrder).toHaveBeenCalledWith("name-asc");
  });

  it("highlights active filters and hides the platform filter on a platform tab", () => {
    renderSection({ libPlatformFilter: "xbox", libAchievementFilter: "with-achievements" });
    expect(screen.getByRole("combobox", { name: "Plateforme" }).className).toContain("border-sky-500/50");
    expect(screen.getByRole("combobox", { name: "Succès" }).className).toContain("border-sky-500/50");
    cleanup();

    renderSection({ activePlatformTab: "steam" });
    expect(screen.queryByRole("combobox", { name: "Plateforme" })).toBeNull();
  });

  it("warns when Steam reports more games than were synced, with shortcuts to fix it", () => {
    const steamAccount = { stats: { gamesOwned: 40 } } as unknown as SteamAccount;
    const props = renderSection({ steamAccount, totalOwnedGamesCount: 12 });

    expect(screen.getByText(/possédez 40 jeux \(12 jeux publics synchronisés\)/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter clé API" }));
    fireEvent.click(screen.getByRole("button", { name: "Import en masse" }));
    expect(props.onAddApiKeyClick).toHaveBeenCalled();
    expect(props.onOpenAddGame).toHaveBeenCalled();
  });

  it("stays quiet when every Steam game is synced", () => {
    const steamAccount = { stats: { gamesOwned: 1 } } as unknown as SteamAccount;
    renderSection({ steamAccount });

    expect(screen.queryByRole("button", { name: "Ajouter clé API" })).toBeNull();
  });
});
