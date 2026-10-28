// @vitest-environment jsdom
// __tests__/components/library/collections/CollectionsPanel.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import CollectionsPanel from "@/components/library/CollectionsPanel";
import AddToCollectionModal from "@/components/library/AddToCollectionModal";
import type { CollectionWithGames } from "@/lib/types";
import { makeOwnedGame } from "../../../helpers/gameFixtures";

const collections = [
  { id: "c1", name: "Co-op", gameIds: [620] },
  { id: "c2", name: "Backlog", gameIds: [] },
] as unknown as CollectionWithGames[];

function renderPanel(overrides: Partial<ComponentProps<typeof CollectionsPanel>> = {}) {
  const props: ComponentProps<typeof CollectionsPanel> = {
    collections,
    selectedCollId: null,
    setSelectedCollId: vi.fn(),
    isCreatingColl: false,
    setIsCreatingColl: vi.fn(),
    newCollName: "",
    setNewCollName: vi.fn(),
    newCollDesc: "",
    setNewCollDesc: vi.fn(),
    handleCreateCollection: vi.fn(),
    handleDeleteCollection: vi.fn(),
    ...overrides,
  };
  render(<CollectionsPanel {...props} />);
  return props;
}

describe("CollectionsPanel", () => {
  afterEach(cleanup);

  it("lists the collections with their game counts and selects one", () => {
    const props = renderPanel({ selectedCollId: "c1" });

    expect(screen.getByRole("button", { name: "Toutes les collections (2)" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Co-op/ }));
    fireEvent.click(screen.getByRole("button", { name: "Toutes les collections (2)" }));

    expect(props.setSelectedCollId).toHaveBeenNthCalledWith(1, "c1");
    expect(props.setSelectedCollId).toHaveBeenNthCalledWith(2, null);
  });

  it("deletes a collection", () => {
    const props = renderPanel();

    fireEvent.click(screen.getAllByTitle("Supprimer la collection")[1]);

    expect(props.handleDeleteCollection).toHaveBeenCalledWith("c2");
  });

  it("toggles the creation form", () => {
    const props = renderPanel({ isCreatingColl: true });

    fireEvent.click(screen.getByRole("button", { name: "Nouvelle Collection" }));

    expect(props.setIsCreatingColl).toHaveBeenCalledWith(false);
  });

  it("keeps the form hidden until the user starts creating", () => {
    renderPanel();

    expect(screen.queryByText("Créer une nouvelle collection de jeux")).toBeNull();
  });

  it("edits, creates and cancels a new collection", () => {
    const props = renderPanel({ isCreatingColl: true, newCollName: "Platines" });

    fireEvent.change(screen.getByPlaceholderText(/Jeux à platiner/), { target: { value: "Platines 2026" } });
    fireEvent.change(screen.getByPlaceholderText(/Objectifs/), { target: { value: "Tout à 100%" } });
    fireEvent.click(screen.getByRole("button", { name: "Créer" }));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(props.setNewCollName).toHaveBeenCalledWith("Platines 2026");
    expect(props.setNewCollDesc).toHaveBeenCalledWith("Tout à 100%");
    expect(props.handleCreateCollection).toHaveBeenCalled();
    expect(props.setIsCreatingColl).toHaveBeenCalledWith(false);
  });

  it("cannot create a collection without a name", () => {
    renderPanel({ isCreatingColl: true, newCollName: "  " });

    expect((screen.getByRole("button", { name: "Créer" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("AddToCollectionModal", () => {
  afterEach(cleanup);

  it("renders nothing without a game", () => {
    const { container } = render(
      <AddToCollectionModal game={null} collections={collections} onClose={vi.fn()} onAddToCollection={vi.fn()} />
    );

    expect(container.innerHTML).toBe("");
  });

  it("adds the game to a collection it is not in yet", () => {
    const game = makeOwnedGame();
    const onAddToCollection = vi.fn();
    render(<AddToCollectionModal game={game} collections={collections} onClose={vi.fn()} onAddToCollection={onAddToCollection} />);

    const already = screen.getByRole("button", { name: /Co-op/ }) as HTMLButtonElement;
    expect(already.disabled).toBe(true);
    expect(already.textContent).toContain("Déjà présent ✓");

    fireEvent.click(screen.getByRole("button", { name: /Backlog/ }));

    expect(onAddToCollection).toHaveBeenCalledWith("c2", game);
  });
});
