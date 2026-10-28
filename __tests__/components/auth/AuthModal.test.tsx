// @vitest-environment jsdom
// __tests__/components/auth/AuthModal.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AuthModal, { type AuthModalProps } from "@/components/auth/AuthModal";
import type { User } from "@/lib/types";
import { jsonResponse } from "../../helpers/responses";

function renderModal(overrides: Partial<AuthModalProps> = {}) {
  const props: AuthModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentUser: null,
    onAuthSuccess: vi.fn(),
    onLogout: vi.fn(),
    ...overrides,
  };
  const view = render(<AuthModal {...props} />);
  return { props, ...view };
}

describe("AuthModal", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders nothing while closed", () => {
    const { container } = renderModal({ isOpen: false });

    expect(container.innerHTML).toBe("");
  });

  it("logs in with the entered credentials", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ user: { id: "u1" } }));
    const { props } = renderModal();

    expect(screen.getByRole("dialog", { name: "Connexion" })).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("tristan"), { target: { value: "tristan" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "secret1" } });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByText("Connexion réussie !")).toBeTruthy();
    expect(props.onAuthSuccess).toHaveBeenCalledWith({ id: "u1" });
  });

  it("asks for a display name when creating an account", () => {
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Créer un compte" }));
    fireEvent.change(screen.getByPlaceholderText("Tristan S."), { target: { value: "Tristan" } });

    expect(screen.getByRole("dialog", { name: "Créer un compte" })).toBeTruthy();
    expect((screen.getByPlaceholderText("Tristan S.") as HTMLInputElement).value).toBe("Tristan");
    fireEvent.click(screen.getByRole("button", { name: "Connexion" }));
    expect(screen.queryByPlaceholderText("Tristan S.")).toBeNull();
  });

  it("shows the login error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "Identifiants invalides" }, 401));
    renderModal();

    fireEvent.change(screen.getByPlaceholderText("tristan"), { target: { value: "tristan" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "wrong12" } });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByText("Identifiants invalides")).toBeTruthy();
  });

  it("shows the signed-in user and logs out", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    const currentUser = { id: "u1", username: "tristan", displayName: "Tristan S." } as User;
    const { props } = renderModal({ currentUser });

    expect(screen.getByRole("heading", { name: "Tristan S." })).toBeTruthy();
    expect(screen.getByText("@tristan")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Se déconnecter/ }));

    expect(await screen.findByText("Déconnexion réussie.")).toBeTruthy();
    expect(props.onLogout).toHaveBeenCalled();
  });

  it("falls back to the username and closes from the signed-in view", () => {
    const { props } = renderModal({ currentUser: { id: "u1", username: "tristan" } as User });

    expect(screen.getByRole("heading", { name: "tristan" })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Fermer" })[1]);

    expect(props.onClose).toHaveBeenCalled();
  });
});
