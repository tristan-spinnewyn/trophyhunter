// @vitest-environment jsdom
// __tests__/components/epic-auth/EpicAuthModal.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import EpicAuthModal from "@/components/epic-auth/EpicAuthModal";
import { EPIC_AUTH_CODE_URL } from "@/lib/epic/auth-input";

function renderModal(overrides: Partial<ComponentProps<typeof EpicAuthModal>> = {}) {
  const props: ComponentProps<typeof EpicAuthModal> = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
  const view = render(<EpicAuthModal {...props} />);
  return { props, ...view };
}

function codeInput() {
  return screen.getByPlaceholderText(/Collez ici/);
}

describe("EpicAuthModal", () => {
  afterEach(cleanup);

  it("renders nothing while closed", () => {
    const { container } = renderModal({ isOpen: false });

    expect(container.innerHTML).toBe("");
  });

  it("explains where to get the code and names the game being synced", () => {
    renderModal({ gameName: "Fortnite" });

    expect(screen.getByText("Synchronisation des succès de « Fortnite »")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Ouvrir la page d'autorisation Epic/ }).getAttribute("href")).toBe(
      EPIC_AUTH_CODE_URL
    );
  });

  it("describes a library connection without a game", () => {
    renderModal();

    expect(screen.getByText("Connexion et récupération des trophées Epic")).toBeTruthy();
  });

  it("extracts the code from the pasted JSON and submits it", () => {
    const { props } = renderModal();

    fireEvent.change(codeInput(), { target: { value: JSON.stringify({ authorizationCode: "abc123" }) } });
    expect(screen.getByText("Code extrait automatiquement")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Synchroniser les succès" }));

    expect(props.onSubmit).toHaveBeenCalledWith("abc123");
  });

  it("refuses a blank input", () => {
    const { props } = renderModal();

    fireEvent.change(codeInput(), { target: { value: "   " } });
    fireEvent.submit(codeInput().closest("form")!);

    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Veuillez saisir votre authorizationCode/)).toBeTruthy();
  });

  it("shows the sync in progress and the server error", () => {
    renderModal({ isLoading: true, error: "Code expiré" });

    expect(screen.getByText("Synchronisation...")).toBeTruthy();
    expect(screen.getByText("Code expiré")).toBeTruthy();
  });

  it("cannot be closed from the backdrop while syncing", () => {
    const { props } = renderModal({ isLoading: true });

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));

    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("closes from the header or the cancel button when idle", () => {
    const { props } = renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(props.onClose).toHaveBeenCalledTimes(2);
  });
});
