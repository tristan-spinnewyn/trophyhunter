// @vitest-environment jsdom
// __tests__/components/library/add-game/AddGameModal.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AddGameModal, { type AddGameModalProps } from "@/components/library/AddGameModal";
import { makeOwnedGame } from "../../../helpers/gameFixtures";

const results = [
  { id: 620, name: "Portal 2", img: "https://example.test/p2.jpg" },
  { id: 1091500, name: "Cyberpunk 2077", img: "https://example.test/cp.jpg" },
];

function renderModal(overrides: Partial<AddGameModalProps> = {}) {
  const props: AddGameModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedPlatformForAdd: "steam",
    setSelectedPlatformForAdd: vi.fn(),
    addGameQuery: "",
    handleSearchAddGame: vi.fn(),
    isSearchingAdd: false,
    addGameResults: [],
    ownedGames: [],
    handleAddGameToLibrary: vi.fn(),
    bulkImportText: "",
    setBulkImportText: vi.fn(),
    handleBulkImport: vi.fn(),
    isBulkImporting: false,
    ...overrides,
  };
  const view = render(<AddGameModal {...props} />);
  return { props, ...view };
}

describe("AddGameModal", () => {
  afterEach(cleanup);

  it("renders nothing while closed", () => {
    const { container } = renderModal({ isOpen: false });

    expect(container.innerHTML).toBe("");
  });

  it("picks the target platform", () => {
    const { props } = renderModal();

    expect(screen.getByRole("button", { name: "Steam" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Xbox" }));

    expect(props.setSelectedPlatformForAdd).toHaveBeenCalledWith("xbox");
  });

  it("searches as the user types and shows a spinner while searching", () => {
    const { props } = renderModal({ isSearchingAdd: true });

    fireEvent.change(screen.getByLabelText("Rechercher un jeu"), { target: { value: "port" } });

    expect(props.handleSearchAddGame).toHaveBeenCalledWith("port");
    expect(screen.getByText("Recherche en cours...")).toBeTruthy();
  });

  it("adds a result, unless the game is already owned on that platform", () => {
    const { props } = renderModal({ addGameResults: results, ownedGames: [makeOwnedGame()] });

    const owned = screen.getByRole("button", { name: "✓ Possédé" }) as HTMLButtonElement;
    expect(owned.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "+ Ajouter" }));

    expect(props.handleAddGameToLibrary).toHaveBeenCalledWith(results[1]);
  });

  it("imports a pasted list of Steam games", () => {
    const { props } = renderModal({ bulkImportText: "620, 1091500" });

    fireEvent.change(screen.getByLabelText(/AppIDs, URLs Steam/), { target: { value: "620" } });
    fireEvent.click(screen.getByRole("button", { name: "Importer dans ma bibliothèque" }));

    expect(props.setBulkImportText).toHaveBeenCalledWith("620");
    expect(props.handleBulkImport).toHaveBeenCalled();
  });

  it("blocks the bulk import while it is empty or running", () => {
    renderModal();
    expect((screen.getByRole("button", { name: "Importer dans ma bibliothèque" }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();

    renderModal({ bulkImportText: "620", isBulkImporting: true });
    expect((screen.getByRole("button", { name: "Importer dans ma bibliothèque" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
