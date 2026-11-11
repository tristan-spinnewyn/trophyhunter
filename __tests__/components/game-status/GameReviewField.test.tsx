// @vitest-environment jsdom
// __tests__/components/game-status/GameReviewField.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GameReviewField } from "@/components/game-status/GameReviewField";

describe("GameReviewField", () => {
  afterEach(cleanup);

  it("shows the current rating and saves a new one with the review kept", () => {
    const onSave = vi.fn();
    render(<GameReviewField rating={3} review="Correct." onSave={onSave} />);

    expect(screen.getByRole("radio", { name: "3 sur 5" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("radio", { name: "5 sur 5" }));

    expect(onSave).toHaveBeenCalledWith({ rating: 5, review: "Correct." });
  });

  it("clears the rating when the current star is clicked again", () => {
    const onSave = vi.fn();
    render(<GameReviewField rating={4} onSave={onSave} />);

    fireEvent.click(screen.getByRole("radio", { name: "4 sur 5" }));

    expect(onSave).toHaveBeenCalledWith({ rating: null, review: null });
  });

  it("saves the review when the field loses focus, only if it changed", () => {
    const onSave = vi.fn();
    render(<GameReviewField rating={2} review="Bof." onSave={onSave} />);
    const field = screen.getByLabelText("Ton avis");

    fireEvent.blur(field);
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(field, { target: { value: "Finalement pas mal." } });
    fireEvent.blur(field);
    expect(onSave).toHaveBeenCalledWith({ rating: 2, review: "Finalement pas mal." });
  });

  it("limits the review length", () => {
    render(<GameReviewField onSave={vi.fn()} />);

    expect(screen.getByLabelText("Ton avis").getAttribute("maxLength")).toBe("2000");
  });
});
