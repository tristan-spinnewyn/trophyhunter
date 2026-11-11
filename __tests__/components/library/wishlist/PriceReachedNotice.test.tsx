// @vitest-environment jsdom
// __tests__/components/library/wishlist/PriceReachedNotice.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PriceReachedNotice } from "@/components/library/wishlist/PriceReachedNotice";
import { makeOwnedGame } from "../../../helpers/gameFixtures";

const wishlist = [
  { appId: 620, platform: "steam", name: "Portal 2", headerImg: "", addedAt: "2026-11-01", lastPriceCents: 499, currency: "EUR", targetPriceCents: 500 },
  { appId: 7, platform: "steam", name: "Tunic", headerImg: "", addedAt: "2026-11-01", lastPriceCents: 2000, currency: "EUR", targetPriceCents: 1000 },
  { appId: 8, platform: "gog", name: "Owned now", headerImg: "", addedAt: "2026-11-01", lastPriceCents: 100, currency: "EUR", targetPriceCents: 1000 },
];

describe("PriceReachedNotice", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("lists the wished games not owned yet whose price reached the target", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ wishlist })));

    render(<PriceReachedNotice ownedGames={[makeOwnedGame({ appId: 8 })]} isSignedIn />);

    const notice = await screen.findByRole("region", { name: "Prix atteints" });
    expect(notice.textContent?.replace(/\s/g, " ")).toContain("Portal 2 à 4,99 €");
    expect(notice.textContent).not.toContain("Tunic");
    expect(notice.textContent).not.toContain("Owned now");
  });

  it("asks nothing for a signed-out visitor", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { container } = render(<PriceReachedNotice ownedGames={[]} isSignedIn={false} />);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(container.innerHTML).toBe("");
  });
});
