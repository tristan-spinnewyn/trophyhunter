// @vitest-environment jsdom
// __tests__/components/ui/ConfirmProvider.test.tsx
import { describe, it, expect, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { ConfirmProvider } from "@/components/ui/confirm/ConfirmProvider";
import { useConfirm } from "@/components/ui/confirm/useConfirm";

let answer: Promise<boolean> | null = null;

function AskButton() {
  const confirm = useConfirm();
  return (
    <button
      type="button"
      onClick={() => {
        answer = confirm({ title: "Retirer Celeste ?", message: "Le jeu quittera ta collection.", confirmLabel: "Retirer" });
      }}
    >
      ask
    </button>
  );
}

function renderWithProvider() {
  render(
    <ConfirmProvider>
      <AskButton />
    </ConfirmProvider>
  );
  act(() => fireEvent.click(screen.getByText("ask")));
}

describe("ConfirmProvider", () => {
  afterEach(() => {
    cleanup();
    answer = null;
  });

  it("shows the request in a dialog and resolves true on confirm", async () => {
    renderWithProvider();

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Le jeu quittera ta collection.")).toBeTruthy();

    act(() => fireEvent.click(screen.getByRole("button", { name: "Retirer" })));

    await expect(answer).resolves.toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("resolves false on cancel", async () => {
    renderWithProvider();

    act(() => fireEvent.click(screen.getByRole("button", { name: "Annuler" })));

    await expect(answer).resolves.toBe(false);
  });

  it("resolves false when the dialog is closed with Escape", async () => {
    renderWithProvider();

    act(() => fireEvent.keyDown(document, { key: "Escape" }));

    await expect(answer).resolves.toBe(false);
  });

  it("refuses to be used outside the provider", () => {
    expect(() => renderHook(() => useConfirm())).toThrow(/ConfirmProvider/);
  });
});
