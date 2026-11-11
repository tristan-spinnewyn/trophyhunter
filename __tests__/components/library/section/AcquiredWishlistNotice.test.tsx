// @vitest-environment jsdom
// __tests__/components/library/section/AcquiredWishlistNotice.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AcquiredWishlistNotice } from "@/components/library/section/AcquiredWishlistNotice";
import { makeOwnedGame } from "../../../helpers/gameFixtures";

afterEach(cleanup);

const starfield = makeOwnedGame({ appId: 1, name: "Starfield", platform: "xbox", status: "unsorted" });
const tunic = makeOwnedGame({ appId: 2, name: "Tunic", status: "completed" });

function renderNotice(wishlistIds = [1, 2]) {
  const onUpdateGameStatus = vi.fn();
  const onToggleWishlist = vi.fn();
  const view = render(
    <AcquiredWishlistNotice
      games={[starfield, tunic]}
      wishlistIds={wishlistIds}
      onUpdateGameStatus={onUpdateGameStatus}
      onToggleWishlist={onToggleWishlist}
    />
  );
  return { ...view, onUpdateGameStatus, onToggleWishlist };
}

describe("AcquiredWishlistNotice", () => {
  it("lists the wished-for games now in the collection and still unsorted", () => {
    renderNotice();

    const notice = screen.getByRole("region", { name: "Jeux de ta liste d'envies acquis" });
    expect(notice.textContent).toContain("Starfield");
    expect(notice.textContent).not.toContain("Tunic");
  });

  it("puts a game in the backlog and takes it off the wishlist", () => {
    const { onUpdateGameStatus, onToggleWishlist } = renderNotice();

    fireEvent.click(screen.getByRole("button", { name: "Mettre Starfield au backlog" }));

    expect(onUpdateGameStatus).toHaveBeenCalledWith(1, "xbox", "backlog");
    expect(onToggleWishlist).toHaveBeenCalledWith(1, "xbox");
  });

  it("only takes a game off the wishlist when asked to", () => {
    const { onUpdateGameStatus, onToggleWishlist } = renderNotice();

    fireEvent.click(screen.getByRole("button", { name: "Retirer Starfield de la liste d'envies" }));

    expect(onToggleWishlist).toHaveBeenCalledWith(1, "xbox");
    expect(onUpdateGameStatus).not.toHaveBeenCalled();
  });

  it("shows nothing when no wished-for game was acquired", () => {
    const { container } = renderNotice([2]);

    expect(container.innerHTML).toBe("");
  });
});
