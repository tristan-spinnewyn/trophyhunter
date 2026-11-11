// @vitest-environment jsdom
// __tests__/components/library/wishlist/WishlistNotOwnedPanel.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WishlistNotOwnedPanel } from "@/components/library/wishlist/WishlistNotOwnedPanel";
import { makeOwnedGame } from "../../../helpers/gameFixtures";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const entries = [
  { appId: 900, platform: "xbox", name: "Starfield", headerImg: "https://example.com/sf.jpg", addedAt: "2026-11-01" },
  { appId: 600, platform: "steam", name: "Half-Life 2", headerImg: "", addedAt: "2026-10-01" },
];

function renderPanel(wishlistIds = [900, 600]) {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ wishlist: entries })));
  const onToggleWishlist = vi.fn();
  render(
    <WishlistNotOwnedPanel
      ownedGames={[makeOwnedGame({ appId: 600, name: "Half-Life 2" })]}
      wishlistIds={wishlistIds}
      onToggleWishlist={onToggleWishlist}
    />
  );
  return { fetchMock, onToggleWishlist };
}

describe("WishlistNotOwnedPanel", () => {
  it("lists the wished-for games that are not in the collection yet", async () => {
    const { fetchMock } = renderPanel();

    const panel = await screen.findByRole("region", { name: "Pas encore dans ta collection" });
    expect(panel.textContent).toContain("Starfield");
    expect(panel.textContent).not.toContain("Half-Life 2");
    expect(fetchMock).toHaveBeenCalledWith("/api/user/wishlist");
  });

  it("takes a game off the wishlist", async () => {
    const { onToggleWishlist } = renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Retirer Starfield de la liste d'envies" }));

    expect(onToggleWishlist).toHaveBeenCalledWith(900, "xbox");
  });

  it("hides a game as soon as it leaves the wishlist", async () => {
    renderPanel([600]);

    await waitFor(() => expect(screen.queryByText("Starfield")).toBeNull());
  });

  it("shows nothing when every wished-for game is owned", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ wishlist: [entries[1]] })));
    const { container } = render(
      <WishlistNotOwnedPanel ownedGames={[makeOwnedGame({ appId: 600 })]} wishlistIds={[600]} onToggleWishlist={vi.fn()} />
    );

    await waitFor(() => expect(container.innerHTML).toBe(""));
  });

  it("shows each wished game's price and saves the price waited for", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ wishlist: [{ ...entries[0], platform: "steam", lastPriceCents: 6999, currency: "EUR" }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
    render(<WishlistNotOwnedPanel ownedGames={[]} wishlistIds={[900]} onToggleWishlist={vi.fn()} />);

    const field = await screen.findByLabelText("Prix cible pour Starfield (€)");
    expect(screen.getByText(/69,99/)).toBeTruthy();
    fireEvent.change(field, { target: { value: "40" } });
    fireEvent.blur(field);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe("/api/user/wishlist/target");
  });

  it("counts down to the release of a wished game", async () => {
    const soon = new Date(Date.now() + 12 * 86_400_000).toISOString();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ wishlist: [{ ...entries[0], releaseDate: soon }] }))
    );
    render(<WishlistNotOwnedPanel ownedGames={[]} wishlistIds={[900]} onToggleWishlist={vi.fn()} />);

    expect(await screen.findByText(/^Sort dans 1[12] j$/)).toBeTruthy();
  });
});
