// @vitest-environment jsdom
// __tests__/components/game-status/PlaytimeField.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PlaytimeField } from "@/components/game-status/PlaytimeField";

describe("PlaytimeField", () => {
  afterEach(cleanup);

  it("saves the hours typed when the field loses focus", () => {
    const onChange = vi.fn();
    render(<PlaytimeField playtimeHours={12} onChange={onChange} />);
    const field = screen.getByLabelText("Heures jouées") as HTMLInputElement;
    expect(field.value).toBe("12");

    fireEvent.change(field, { target: { value: "14.5" } });
    fireEvent.blur(field);

    expect(onChange).toHaveBeenCalledWith(14.5);
  });

  it("ignores an unchanged, negative or unreadable value", () => {
    const onChange = vi.fn();
    render(<PlaytimeField playtimeHours={3} onChange={onChange} />);
    const field = screen.getByLabelText("Heures jouées") as HTMLInputElement;

    fireEvent.blur(field);
    fireEvent.change(field, { target: { value: "-2" } });
    fireEvent.blur(field);

    expect(onChange).not.toHaveBeenCalled();
    expect(field.value).toBe("3");
  });

  it("starts empty for a game never timed", () => {
    render(<PlaytimeField onChange={vi.fn()} />);

    expect((screen.getByLabelText("Heures jouées") as HTMLInputElement).value).toBe("");
  });
});
