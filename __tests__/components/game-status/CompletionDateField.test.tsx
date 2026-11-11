// @vitest-environment jsdom
// __tests__/components/game-status/CompletionDateField.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CompletionDateField } from "@/components/game-status/CompletionDateField";

afterEach(cleanup);

const field = () => screen.getByLabelText("Terminé le") as HTMLInputElement;

describe("CompletionDateField", () => {
  it("shows the day the game was finished", () => {
    render(<CompletionDateField completedAt="2025-07-01T12:00:00.000Z" onChange={vi.fn()} />);

    expect(field().type).toBe("date");
    expect(field().value).toBe("2025-07-01");
    expect(screen.queryByText(/Date inconnue/)).toBeNull();
  });

  it("invites to fill in an unknown date, since the game cannot be shelved in its year without it", () => {
    render(<CompletionDateField onChange={vi.fn()} />);

    expect(field().value).toBe("");
    expect(screen.getByText("Date inconnue : indique-la pour ranger ce jeu dans son année.")).toBeTruthy();
  });

  it("does not offer days in the future", () => {
    render(<CompletionDateField onChange={vi.fn()} />);

    expect(field().max).toBe(new Date().toISOString().slice(0, 10));
  });

  it("keeps what is being typed and only passes on a whole, plausible day", () => {
    const onChange = vi.fn();
    render(<CompletionDateField onChange={onChange} />);

    fireEvent.change(field(), { target: { value: "0202-08-14" } });

    expect(field().value).toBe("0202-08-14");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows the new date when the saved one changes", () => {
    const { rerender } = render(<CompletionDateField completedAt="2025-07-01T12:00:00.000Z" onChange={vi.fn()} />);

    rerender(<CompletionDateField completedAt="2023-08-14T12:00:00.000Z" onChange={vi.fn()} />);

    expect(field().value).toBe("2023-08-14");
  });

  it("passes on the picked day", () => {
    const onChange = vi.fn();
    render(<CompletionDateField onChange={onChange} />);

    fireEvent.change(field(), { target: { value: "2023-08-14" } });

    expect(onChange).toHaveBeenCalledWith("2023-08-14");
  });
});
