// @vitest-environment jsdom
// __tests__/components/library/card/LibraryGameCard.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import LibraryGameCard, { type LibraryGameCardProps } from "@/components/library/LibraryGameCard";
import { ConfirmProvider } from "@/components/ui/confirm/ConfirmProvider";
import { makeOwnedGame } from "../../../helpers/gameFixtures";
import type { CollectionWithGames } from "@/lib/types";

function renderCard(overrides: Partial<LibraryGameCardProps> = {}) {
  const props: LibraryGameCardProps = {
    game: makeOwnedGame(),
    activePlatformTab: "all",
    selectedCollId: null,
    wishlistIds: [],
    collections: [],
    onSelectGame: vi.fn(),
    onToggleWishlist: vi.fn(),
    onOpenAddToCollection: vi.fn(),
    onRemoveFromCollection: vi.fn(),
    onSyncGame: vi.fn().mockResolvedValue(undefined),
    onRemoveGame: vi.fn().mockResolvedValue(undefined),
    onUpdateGameStatus: vi.fn(),
    ...overrides,
  };
  render(
    <ConfirmProvider>
      <LibraryGameCard {...props} />
    </ConfirmProvider>
  );
  return props;
}

describe("LibraryGameCard", () => {
  afterEach(cleanup);

  it("shows the achievement progress and opens the game from the cover and the title", () => {
    const props = renderCard({ game: makeOwnedGame({ playtimeHours: 12 }) });

    expect(screen.getByText(/4 \/ 10 succès/).textContent).toContain("12 h");
    expect(screen.getByText("40%")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir Portal 2" }));
    fireEvent.click(screen.getByText("Portal 2"));
    expect(props.onSelectGame).toHaveBeenNthCalledWith(1, 620);
    expect(props.onSelectGame).toHaveBeenNthCalledWith(2, 620);
  });

  it("marks a completed game with a 100% badge", () => {
    renderCard({ game: makeOwnedGame({ unlockedCount: 10 }) });

    expect(screen.getAllByText("100%")).toHaveLength(2);
  });

  it("says when a game has no achievements and counts Epic progress in XP", () => {
    renderCard({ game: makeOwnedGame({ totalAchievements: 0, unlockedCount: 0 }) });
    expect(screen.getByText("Aucun succès")).toBeTruthy();
    cleanup();

    renderCard({ game: makeOwnedGame({ platform: "epic" }) });
    expect(screen.getByText("4 / 10 XP")).toBeTruthy();
  });

  it("hides a cover image that fails to load", () => {
    renderCard();
    const img = document.querySelector("img")!;

    fireEvent.error(img);

    expect(img.style.display).toBe("none");
  });

  it("toggles the wishlist, reflecting the current state in its label", () => {
    const props = renderCard({ wishlistIds: [620] });

    const button = screen.getByRole("button", { name: "Retirer de ma liste d'envies" });
    expect(button.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(button);

    expect(props.onToggleWishlist).toHaveBeenCalledWith(620, "steam");
  });

  it("offers collection actions only when collections exist and one is selected", () => {
    const collections = [{ id: "c1" }] as unknown as CollectionWithGames[];
    const props = renderCard({ collections, activePlatformTab: "collections", selectedCollId: "c1" });

    fireEvent.click(screen.getByRole("button", { name: "Ajouter à une collection" }));
    fireEvent.click(screen.getByRole("button", { name: "Retirer de cette collection" }));

    expect(props.onOpenAddToCollection).toHaveBeenCalledWith(props.game);
    expect(props.onRemoveFromCollection).toHaveBeenCalledWith("c1", 620, "steam");
  });

  it("hides collection actions without collections", () => {
    renderCard();

    expect(screen.queryByRole("button", { name: "Ajouter à une collection" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Retirer de cette collection" })).toBeNull();
  });

  it("syncs a Steam game only when a Steam account is linked", () => {
    renderCard();
    expect(screen.queryByRole("button", { name: "Actualiser les succès Steam" })).toBeNull();
    cleanup();

    const props = renderCard({ steamAccount: { platform: "steam", username: "gabe" } as LibraryGameCardProps["steamAccount"] });
    fireEvent.click(screen.getByRole("button", { name: "Actualiser les succès Steam" }));
    expect(props.onSyncGame).toHaveBeenCalledWith(props.game);
  });

  it("always syncs Epic games", () => {
    renderCard({ game: makeOwnedGame({ platform: "epic" }) });

    expect(screen.getByRole("button", { name: "Synchroniser les succès Epic Games" })).toBeTruthy();
  });

  it("removes the game only after the user confirms", async () => {
    const props = renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Retirer de ma bibliothèque" }));
    fireEvent.click(await screen.findByRole("button", { name: "Annuler" }));
    await vi.waitFor(() => expect(screen.queryByText("Retirer « Portal 2 » ?")).toBeNull());
    expect(props.onRemoveGame).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Retirer de ma bibliothèque" }));
    fireEvent.click(await screen.findByRole("button", { name: "Retirer" }));

    await vi.waitFor(() => expect(props.onRemoveGame).toHaveBeenCalledWith(620, "steam"));
  });

  it("changes the game status from the selector", () => {
    const props = renderCard();

    fireEvent.change(screen.getByRole("combobox", { name: "Statut de Portal 2" }), { target: { value: "completed" } });

    expect(props.onUpdateGameStatus).toHaveBeenCalledWith(620, "steam", "completed");
  });

  it("disables the status selector without an update handler", () => {
    renderCard({ onUpdateGameStatus: undefined });

    expect((screen.getByRole("combobox") as HTMLSelectElement).disabled).toBe(true);
  });
});

