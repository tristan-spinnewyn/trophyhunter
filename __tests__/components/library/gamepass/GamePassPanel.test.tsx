// @vitest-environment jsdom
// __tests__/components/library/gamepass/GamePassPanel.test.tsx
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";
import type { GamePassPanelProps } from "@/components/library/gamepass/GamePassPanel.types";
import { makeOwnedGame } from "../../../helpers/gameFixtures";

function makeItem(overrides: Partial<GamePassCatalogItem> = {}): GamePassCatalogItem {
  return {
    storeId: "9NBLGGH4R315",
    appId: 1001,
    name: "Halo Infinite",
    headerImg: "https://example.test/halo.jpg",
    developer: "343 Industries",
    publisher: "Xbox Game Studios",
    category: "Shooter",
    shortDescription: "Master Chief returns.",
    hasXboxAchievements: true,
    isPlayAnywhere: true,
    ...overrides,
  };
}

let catalogState: Record<string, unknown>;
const loadCatalog = vi.fn();

vi.mock("@/components/library/hooks/useGamePassCatalog", () => ({
  useGamePassCatalog: () => catalogState,
}));

const { default: GamePassPanel } = await import("@/components/library/GamePassPanel");

function renderPanel(overrides: Partial<GamePassPanelProps> = {}) {
  const props: GamePassPanelProps = {
    ownedGames: [],
    wishlistIds: [],
    onAddGameToXbox: vi.fn().mockResolvedValue(undefined),
    onToggleWishlist: vi.fn().mockResolvedValue(undefined),
    onSelectGame: vi.fn(),
    ...overrides,
  };
  render(<GamePassPanel {...props} />);
  return props;
}

describe("GamePassPanel", () => {
  beforeEach(() => {
    const items = [makeItem()];
    catalogState = {
      catalog: items,
      filteredGames: items,
      visibleGames: items,
      hasMore: false,
      isLoading: false,
      error: null,
      searchQuery: "",
      setSearchQuery: vi.fn(),
      categoryFilter: "all",
      setCategoryFilter: vi.fn(),
      featureFilter: "all",
      setFeatureFilter: vi.fn(),
      categories: ["Shooter", "RPG"],
      loadCatalog,
      handleLoadMore: vi.fn(),
    };
    loadCatalog.mockClear();
  });
  afterEach(cleanup);

  it("counts the visible catalog and renders one card per game", () => {
    renderPanel();

    expect(screen.getByText("1 / 1 jeux PC Game Pass")).toBeTruthy();
    expect(screen.getByText("Halo Infinite")).toBeTruthy();
    expect(screen.getByText("Succès")).toBeTruthy();
    expect(screen.getByText("Master Chief returns.")).toBeTruthy();
  });

  it("forwards toolbar changes to the catalog state", () => {
    renderPanel();

    fireEvent.change(screen.getByPlaceholderText(/Rechercher un jeu PC Game Pass/), { target: { value: "halo" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "RPG" } });
    fireEvent.click(screen.getByRole("button", { name: "✨ Non possédés" }));
    fireEvent.click(screen.getByRole("button", { name: "Actualiser" }));

    expect(catalogState.setSearchQuery).toHaveBeenCalledWith("halo");
    expect(catalogState.setCategoryFilter).toHaveBeenCalledWith("RPG");
    expect(catalogState.setFeatureFilter).toHaveBeenCalledWith("unowned");
    expect(loadCatalog).toHaveBeenCalledWith(true);
  });

  it("shows a loading message while the catalog syncs", () => {
    catalogState.isLoading = true;
    renderPanel();

    expect(screen.getByText(/Synchronisation du catalogue/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Actualiser" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the error with a retry button", () => {
    catalogState.error = "Microsoft Store indisponible";
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(screen.getByText("Microsoft Store indisponible")).toBeTruthy();
    expect(loadCatalog).toHaveBeenCalledWith(true);
  });

  it("says when no game matches", () => {
    catalogState.visibleGames = [];
    renderPanel();

    expect(screen.getByText("Aucun jeu PC Game Pass trouvé")).toBeTruthy();
  });

  it("loads more games when some are hidden", () => {
    catalogState.filteredGames = [makeItem(), makeItem({ storeId: "B", appId: 2 })];
    catalogState.hasMore = true;
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Afficher plus de jeux (1 / 2)" }));

    expect(catalogState.handleLoadMore).toHaveBeenCalled();
  });

  it("adds an unowned game to the Xbox library and toggles its wishlist entry without opening it", () => {
    const props = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Ajouter (Xbox/PC)" }));
    fireEvent.click(screen.getByTitle("Ajouter à la liste d'envies"));

    expect(props.onAddGameToXbox).toHaveBeenCalledWith(makeItem());
    expect(props.onToggleWishlist).toHaveBeenCalledWith(1001, "xbox");
    expect(props.onSelectGame).not.toHaveBeenCalled();
  });

  it("opens the game from its cover, title, owned badge and details button", () => {
    const props = renderPanel({
      ownedGames: [makeOwnedGame({ appId: 1001, name: "Halo Infinite" })],
      wishlistIds: [1001],
    });

    fireEvent.click(screen.getByAltText("Halo Infinite"));
    fireEvent.click(screen.getByText("Halo Infinite"));
    fireEvent.click(screen.getByRole("button", { name: "Dans ma bibliothèque" }));
    fireEvent.click(screen.getByTitle("Voir les succès"));

    expect(screen.getByTitle("Retirer de la liste d'envies")).toBeTruthy();
    expect(props.onSelectGame).toHaveBeenCalledTimes(4);
    expect(props.onSelectGame).toHaveBeenCalledWith(1001, "Halo Infinite");
  });

  it("falls back to a placeholder without a cover image", () => {
    catalogState.visibleGames = [makeItem({ headerImg: "", hasXboxAchievements: false, shortDescription: "" })];
    renderPanel();

    expect(screen.getByText("PC Game Pass")).toBeTruthy();
    expect(screen.queryByText("Succès")).toBeNull();
  });
});
