// @vitest-environment jsdom
// __tests__/components/ui/Modal.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Modal } from "@/components/ui/Modal";

describe("Modal", () => {
  afterEach(cleanup);

  it("renders an accessible dialog labelled by its title", () => {
    render(<Modal title="Ajouter des jeux" onClose={vi.fn()}>body</Modal>);

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)?.textContent).toBe("Ajouter des jeux");
  });

  it("closes from the close button", () => {
    const onClose = vi.fn();
    render(<Modal title="T" onClose={onClose}>body</Modal>);

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on a backdrop click but not on a click inside the dialog", () => {
    const onClose = vi.fn();
    render(<Modal title="T" onClose={onClose}><p>inside</p></Modal>);

    fireEvent.click(screen.getByText("inside"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<Modal title="T" onClose={onClose}>body</Modal>);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
