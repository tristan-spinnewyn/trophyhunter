// @vitest-environment jsdom
// __tests__/components/library/wishlist/WishlistPriceField.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WishlistPriceField } from "@/components/library/wishlist/WishlistPriceField";

const portal = { appId: 620, platform: "steam" as const, name: "Portal 2", headerImg: "", addedAt: "2026-11-01" };
const nbsp = (s: string | null | undefined) => (s ?? "").replace(/\s/g, " ");

describe("WishlistPriceField", () => {
  afterEach(cleanup);

  it("shows the store price and saves a target typed in euros as cents", () => {
    const onSaveTarget = vi.fn();
    render(<WishlistPriceField entry={{ ...portal, lastPriceCents: 1499, currency: "EUR" }} onSaveTarget={onSaveTarget} />);

    expect(nbsp(screen.getByText(/14,99/).textContent)).toBe("14,99 €");
    const field = screen.getByLabelText("Prix cible pour Portal 2 (€)");
    fireEvent.change(field, { target: { value: "9,50" } });
    fireEvent.blur(field);

    expect(onSaveTarget).toHaveBeenCalledWith(620, 950);
  });

  it("clears the target when the field is emptied, and ignores unreadable values", () => {
    const onSaveTarget = vi.fn();
    render(<WishlistPriceField entry={{ ...portal, targetPriceCents: 1000 }} onSaveTarget={onSaveTarget} />);
    const field = screen.getByLabelText("Prix cible pour Portal 2 (€)") as HTMLInputElement;
    expect(field.value).toBe("10");

    fireEvent.change(field, { target: { value: "abc" } });
    fireEvent.blur(field);
    expect(onSaveTarget).not.toHaveBeenCalled();
    expect(field.value).toBe("10");

    fireEvent.change(field, { target: { value: "" } });
    fireEvent.blur(field);
    expect(onSaveTarget).toHaveBeenCalledWith(620, null);
  });

  it("flags a price at or under the target", () => {
    render(<WishlistPriceField entry={{ ...portal, lastPriceCents: 900, currency: "EUR", targetPriceCents: 1000 }} onSaveTarget={vi.fn()} />);

    expect(screen.getByText("Prix atteint")).toBeTruthy();
  });

  it("says when the store gives no price", () => {
    render(<WishlistPriceField entry={{ ...portal, platform: "xbox" }} onSaveTarget={vi.fn()} />);

    expect(screen.getByText("Prix inconnu")).toBeTruthy();
  });
});
