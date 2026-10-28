// @vitest-environment jsdom
// __tests__/components/game-header/GameHeader.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import GameHeader, { type GameHeaderProps } from "@/components/game-header/GameHeader";
import { ConfirmProvider } from "@/components/ui/confirm/ConfirmProvider";
import type { GameHuntingMeta } from "@/lib/hunting/hunting.types";
import { makeGameDetails } from "../../helpers/gameFixtures";

const huntingMeta: GameHuntingMeta = {
  difficultyRating: 3,
  difficultyLabel: "Facile",
  difficultyBadgeClass: "border-emerald-500",
  estimatedHours: 12,
  minPlaythroughs: 1,
  missableCount: 0,
  onlineCount: 0,
  warningType: "none",
  warningMessage: null,
  isCustomOverride: false,
};

function renderHeader(overrides: Partial<GameHeaderProps> = {}) {
  const props: GameHeaderProps = {
    game: makeGameDetails({ developers: ["Valve", "Valve Seattle"] }),
    isFavorite: false,
    onToggleFavorite: vi.fn(),
    ...overrides,
  };
  render(
    <ConfirmProvider>
      <GameHeader {...props} />
    </ConfirmProvider>
  );
  return props;
}

describe("GameHeader", () => {
  afterEach(cleanup);

  it("shows the game name, playtime, achievement count and developers", () => {
    renderHeader({ playtimeHours: 30 });

    expect(screen.getByRole("heading", { name: "Portal 2" })).toBeTruthy();
    expect(screen.getByText("30 h jouées")).toBeTruthy();
    expect(screen.getByText("51 succès")).toBeTruthy();
    expect(screen.getByText("Valve, Valve Seattle")).toBeTruthy();
  });

  it("omits the playtime and developers when unknown", () => {
    renderHeader({ game: makeGameDetails(), playtimeHours: 0 });

    expect(screen.queryByText(/h jouées/)).toBeNull();
    expect(screen.queryByText("•")).toBeNull();
  });

  it("links to the guides and the Steam store", () => {
    renderHeader();

    expect(screen.getByRole("link", { name: /Guide PSTHC/ }).getAttribute("href")).toBe("https://example.test/psthc");
    expect(screen.getByRole("link", { name: /Guides Steam/ }).getAttribute("href")).toBe("https://example.test/guides");
    expect(screen.getByRole("link", { name: /YouTube FR/ }).getAttribute("href")).toBe("https://example.test/youtube");
    expect(screen.getByRole("link", { name: /Magasin Steam/ }).getAttribute("href")).toBe("https://store.steampowered.com/app/620");
  });

  it("goes back to the library when a back handler is given", () => {
    const onBackToLibrary = vi.fn();
    renderHeader({ onBackToLibrary });

    fireEvent.click(screen.getByRole("button", { name: "Ma collection" }));

    expect(onBackToLibrary).toHaveBeenCalled();
  });

  it("toggles the favorite state", () => {
    const props = renderHeader({ isFavorite: true });

    const star = screen.getByRole("button", { name: "Retirer des favoris" });
    expect(star.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(star);

    expect(props.onToggleFavorite).toHaveBeenCalled();
  });

  it("offers to add a game outside the collection through the status select", () => {
    const onChangeGameStatus = vi.fn();
    renderHeader({ onChangeGameStatus });

    const select = screen.getByRole("combobox", { name: "Statut du jeu" }) as HTMLSelectElement;
    expect(select.value).toBe("");
    fireEvent.change(select, { target: { value: "in-progress" } });

    expect(onChangeGameStatus).toHaveBeenCalledWith("in-progress");
    expect(screen.queryByRole("button", { name: "Retirer de ma collection" })).toBeNull();
  });

  it("shows the current status of an owned game", () => {
    renderHeader({ isOwned: true, gameStatus: "paused", onChangeGameStatus: vi.fn() });

    expect((screen.getByRole("combobox", { name: "Statut du jeu" }) as HTMLSelectElement).value).toBe("paused");
  });

  it("removes an owned game from the collection only after confirmation", async () => {
    const onToggleOwned = vi.fn();
    renderHeader({ isOwned: true, onToggleOwned });

    fireEvent.click(screen.getByRole("button", { name: "Retirer de ma collection" }));
    fireEvent.click(await screen.findByRole("button", { name: "Annuler" }));
    await vi.waitFor(() => expect(screen.queryByText("Retirer ce jeu de ta collection ?")).toBeNull());
    expect(onToggleOwned).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Retirer de ma collection" }));
    fireEvent.click(await screen.findByRole("button", { name: "Retirer" }));

    await vi.waitFor(() => expect(onToggleOwned).toHaveBeenCalled());
  });

  it("shows the hunting meta when known", () => {
    renderHeader({ huntingMeta });

    expect(screen.getByText(/Difficulté : 3\/10/)).toBeTruthy();
  });
});
