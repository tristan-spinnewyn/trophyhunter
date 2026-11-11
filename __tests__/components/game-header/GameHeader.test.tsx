// @vitest-environment jsdom
// __tests__/components/game-header/GameHeader.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import GameHeader, { type GameHeaderProps } from "@/components/game-header/GameHeader";
import { ConfirmProvider } from "@/components/ui/confirm/ConfirmProvider";
import type { GameHuntingMeta } from "@/lib/hunting/hunting.types";
import { makeGameDetails } from "../../helpers/gameFixtures";
import { manualGameId } from "@/lib/game/manual-game";

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

  it("offers to add a game outside the collection through the status picker", () => {
    const onChangeGameStatus = vi.fn();
    renderHeader({ onChangeGameStatus });

    expect(screen.getAllByRole("radio").some((r) => r.getAttribute("aria-checked") === "true")).toBe(false);
    fireEvent.click(screen.getByRole("radio", { name: "En cours" }));

    expect(onChangeGameStatus).toHaveBeenCalledWith("in-progress");
    expect(screen.queryByRole("button", { name: "Retirer de ma collection" })).toBeNull();
  });

  it("lets the finish date of a finished game be set", () => {
    const onChangeCompletedAt = vi.fn();
    renderHeader({ isOwned: true, gameStatus: "completed", onChangeGameStatus: vi.fn(), onChangeCompletedAt });

    fireEvent.change(screen.getByLabelText("Terminé le"), { target: { value: "2023-08-14" } });

    expect(onChangeCompletedAt).toHaveBeenCalledWith("2023-08-14");
  });

  it("asks for no finish date while the game is not finished", () => {
    renderHeader({ isOwned: true, gameStatus: "in-progress", onChangeGameStatus: vi.fn(), onChangeCompletedAt: vi.fn() });

    expect(screen.queryByLabelText("Terminé le")).toBeNull();
  });

  it("lets a finished or abandoned game be rated", () => {
    const onSaveReview = vi.fn();
    renderHeader({ isOwned: true, gameStatus: "abandoned", rating: 2, onSaveReview });

    fireEvent.click(screen.getByRole("radio", { name: "4 sur 5" }));

    expect(onSaveReview).toHaveBeenCalledWith({ rating: 4, review: null });
  });

  it("asks for no rating while the game is still being played", () => {
    renderHeader({ isOwned: true, gameStatus: "in-progress", onSaveReview: vi.fn() });

    expect(screen.queryByRole("radiogroup", { name: "Ta note" })).toBeNull();
  });

  it("lets the playtime of a game on a platform tracked by hand be typed", () => {
    const onChangePlaytime = vi.fn();
    renderHeader({ isOwned: true, platform: "switch", gameStatus: "in-progress", playtimeHours: 5, onChangePlaytime });

    const field = screen.getByLabelText("Heures jouées");
    fireEvent.change(field, { target: { value: "7" } });
    fireEvent.blur(field);

    expect(onChangePlaytime).toHaveBeenCalledWith(7);
  });

  it("keeps the playtime read-only for a synced platform", () => {
    renderHeader({ isOwned: true, platform: "steam", playtimeHours: 5, onChangePlaytime: vi.fn() });

    expect(screen.queryByLabelText("Heures jouées")).toBeNull();
    expect(screen.getByText("5 h jouées")).toBeTruthy();
  });

  it("links no Steam page for a game added by hand", () => {
    const id = manualGameId("Kirby Air Riders");
    renderHeader({ game: { ...makeGameDetails(), id, guideLinks: { steamGuidesUrl: "", psthcUrl: "https://psthc.test", youtubeUrl: "https://yt.test" } }, platform: "switch" });

    expect(screen.queryByRole("link", { name: /Magasin Steam/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Guides Steam/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Guide PSTHC/ })).toBeTruthy();
  });

  it("shows the current status of an owned game", () => {
    renderHeader({ isOwned: true, gameStatus: "paused", onChangeGameStatus: vi.fn() });

    expect(screen.getByRole("radio", { name: "En pause" }).getAttribute("aria-checked")).toBe("true");
  });

  it("shows the portrait box art of the game", () => {
    renderHeader();
    expect(document.querySelector("img")?.getAttribute("src")).toContain("/steam/apps/620/library_600x900.jpg");
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
