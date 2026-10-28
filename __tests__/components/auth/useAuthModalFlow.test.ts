// @vitest-environment jsdom
// __tests__/components/auth/useAuthModalFlow.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { useAuthModalFlow } from "@/components/auth/useAuthModalFlow";
import { jsonResponse } from "../../helpers/responses";

const submitEvent = { preventDefault: vi.fn() } as unknown as FormEvent;

function setup() {
  const props = { onAuthSuccess: vi.fn(), onLogout: vi.fn(), onClose: vi.fn() };
  return { ...renderHook(() => useAuthModalFlow(props)), props };
}

describe("useAuthModalFlow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("logs in and closes the modal after a short delay", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ user: { id: "u1" } }));
    const { result, props } = setup();
    act(() => {
      result.current.setUsername(" gabe ");
      result.current.setPassword("pw");
    });

    await act(() => result.current.handleSubmit(submitEvent));

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({ body: JSON.stringify({ username: "gabe", password: "pw" }) })
    );
    expect(props.onAuthSuccess).toHaveBeenCalledWith({ id: "u1" });
    expect(result.current.successMsg).toBe("Connexion réussie !");
    act(() => vi.advanceTimersByTime(1000));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("registers with a display name", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ user: { id: "u2" } }));
    const { result } = setup();
    act(() => {
      result.current.setMode("register");
      result.current.setUsername("new");
      result.current.setDisplayName(" New One ");
    });

    await act(() => result.current.handleSubmit(submitEvent));

    expect(fetchSpy.mock.calls[0][0]).toBe("/api/auth/register");
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body)).displayName).toBe("New One");
    expect(result.current.successMsg).toContain("Compte créé");
  });

  it("shows the server error, or a generic one", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({ error: "Mot de passe incorrect." }, 401));
    const { result, props } = setup();
    await act(() => result.current.handleSubmit(submitEvent));
    expect(result.current.errorMsg).toBe("Mot de passe incorrect.");
    expect(props.onAuthSuccess).not.toHaveBeenCalled();

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({}, 500));
    await act(() => result.current.handleSubmit(submitEvent));
    expect(result.current.errorMsg).toBe("Une erreur est survenue.");
    expect(result.current.isLoading).toBe(false);
  });

  it("logs out, or reports a failed logout", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({ success: true }));
    const { result, props } = setup();
    await act(() => result.current.handleLogout());
    expect(props.onLogout).toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(600));
    expect(props.onClose).toHaveBeenCalled();

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("offline"));
    await act(() => result.current.handleLogout());
    expect(result.current.errorMsg).toBe("Erreur lors de la déconnexion.");
  });
});
