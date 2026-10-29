// @vitest-environment jsdom
// __tests__/components/auth/AuthGate.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AuthGate from "@/components/auth/AuthGate";
import { jsonResponse } from "../../helpers/responses";

function fill(placeholder: string, value: string) {
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
}

function submit(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("AuthGate", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("logs the user in and hands the user over after a short delay", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ user: { id: "u1" } }));
    const onAuthSuccess = vi.fn();
    render(<AuthGate onAuthSuccess={onAuthSuccess} />);

    fill("Nom d'utilisateur", "  tristan ");
    fill("Mot de passe", "secret1");
    submit("Accéder à ma bibliothèque");

    expect(await screen.findByText(/Connexion réussie/)).toBeTruthy();
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/auth/login");
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({ username: "tristan", password: "secret1" });
    await vi.waitFor(() => expect(onAuthSuccess).toHaveBeenCalledWith({ id: "u1" }), { timeout: 2000 });
  });

  it("registers with an optional display name", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ user: { id: "u2" } }));
    render(<AuthGate onAuthSuccess={vi.fn()} />);

    submit("Créer un profil");
    fill("Nom d'utilisateur", "new");
    fill("Nom d'affichage (Optionnel)", " New One ");
    fill("Mot de passe", "secret1");
    submit("Démarrer avec SQLite");

    expect(await screen.findByText(/Compte créé avec succès/)).toBeTruthy();
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/auth/register");
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body)).displayName).toBe("New One");
  });

  it("shows the server error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "Identifiants invalides" }, 401));
    render(<AuthGate onAuthSuccess={vi.fn()} />);

    fill("Nom d'utilisateur", "tristan");
    fill("Mot de passe", "wrong12");
    submit("Accéder à ma bibliothèque");

    expect(await screen.findByText("Identifiants invalides")).toBeTruthy();
  });

  it("falls back to a generic error message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 500));
    render(<AuthGate onAuthSuccess={vi.fn()} />);

    fill("Nom d'utilisateur", "tristan");
    fill("Mot de passe", "secret1");
    submit("Accéder à ma bibliothèque");

    expect(await screen.findByText("Une erreur est survenue.")).toBeTruthy();
  });

  it("switches back to login", () => {
    render(<AuthGate onAuthSuccess={vi.fn()} />);

    submit("Créer un profil");
    submit("Se connecter");

    expect(screen.queryByPlaceholderText("Nom d'affichage (Optionnel)")).toBeNull();
  });

  it("offers to migrate games left in the browser by the old version", () => {
    localStorage.setItem("trophyhunter_owned_games", JSON.stringify([{ appId: 1 }, { appId: 2 }]));
    render(<AuthGate onAuthSuccess={vi.fn()} />);

    expect(screen.getByText("2 jeux détectés")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Démarrer avec SQLite" })).toBeTruthy();
  });

  it("ignores unreadable legacy data", () => {
    localStorage.setItem("trophyhunter_owned_games", "{not json");
    render(<AuthGate onAuthSuccess={vi.fn()} />);

    expect(screen.queryByText(/jeux détectés/)).toBeNull();
  });
});
