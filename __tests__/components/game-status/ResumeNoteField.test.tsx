// @vitest-environment jsdom
// __tests__/components/game-status/ResumeNoteField.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ResumeNoteField } from "@/components/game-status/ResumeNoteField";

describe("ResumeNoteField", () => {
  afterEach(cleanup);

  it("shows the saved note", () => {
    render(<ResumeNoteField note="Chapitre 4." onSave={vi.fn()} />);

    expect((screen.getByLabelText("Où tu en es") as HTMLTextAreaElement).value).toBe("Chapitre 4.");
  });

  it("saves the note when the field loses focus, only if it changed", () => {
    const onSave = vi.fn();
    render(<ResumeNoteField note="Chapitre 4." onSave={onSave} />);
    const field = screen.getByLabelText("Où tu en es");

    fireEvent.blur(field);
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(field, { target: { value: "Chapitre 5, la forge." } });
    fireEvent.blur(field);
    expect(onSave).toHaveBeenCalledWith("Chapitre 5, la forge.");
  });

  it("saves a cleared note as null", () => {
    const onSave = vi.fn();
    render(<ResumeNoteField note="Chapitre 4." onSave={onSave} />);
    const field = screen.getByLabelText("Où tu en es");

    fireEvent.change(field, { target: { value: "  " } });
    fireEvent.blur(field);

    expect(onSave).toHaveBeenCalledWith(null);
  });

  it("limits the note length", () => {
    render(<ResumeNoteField onSave={vi.fn()} />);

    expect(screen.getByLabelText("Où tu en es").getAttribute("maxLength")).toBe("500");
  });
});
