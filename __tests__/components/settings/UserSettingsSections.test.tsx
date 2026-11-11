// @vitest-environment jsdom
// __tests__/components/settings/UserSettingsSections.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UserSettingsSections } from "@/components/settings/UserSettingsSections";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("UserSettingsSections", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows the current interval and saves a new one", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ settings: { autoSyncHours: null, staleAfterWeeks: 6 } }))
      .mockResolvedValueOnce(jsonResponse({ settings: { autoSyncHours: 12, staleAfterWeeks: 6 } }));

    render(<UserSettingsSections />);

    const select = (await screen.findByLabelText("Synchroniser mes plateformes")) as HTMLSelectElement;
    expect(select.value).toBe("off");

    fireEvent.change(select, { target: { value: "12" } });

    await waitFor(() => expect(select.value).toBe("12"));
    const [url, init] = fetchSpy.mock.calls[1];
    expect(url).toBe("/api/user/settings");
    expect(init).toMatchObject({ method: "PUT", body: JSON.stringify({ autoSyncHours: 12 }) });
    expect(screen.getByText(/toutes les 12 h/)).toBeTruthy();
  });

  it("turns the sync off", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ settings: { autoSyncHours: 24, staleAfterWeeks: 6 } }))
      .mockResolvedValueOnce(jsonResponse({ settings: { autoSyncHours: null, staleAfterWeeks: 6 } }));

    render(<UserSettingsSections />);
    const select = (await screen.findByLabelText("Synchroniser mes plateformes")) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "off" } });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(fetchSpy.mock.calls[1][1]).toMatchObject({ body: JSON.stringify({ autoSyncHours: null }) });
  });

  it("stays hidden for a signed-out visitor", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ error: "Non authentifié" }, 401));

    const { container } = render(<UserSettingsSections />);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(container.innerHTML).toBe("");
  });

  it("keeps the previous value when saving fails", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ settings: { autoSyncHours: 6, staleAfterWeeks: 6 } }))
      .mockResolvedValueOnce(jsonResponse({ error: "x" }, 500));

    render(<UserSettingsSections />);
    const select = (await screen.findByLabelText("Synchroniser mes plateformes")) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "24" } });

    await screen.findByText("Impossible d'enregistrer ce réglage.");
    expect(select.value).toBe("6");
  });

  it("saves how many weeks before an in-progress game is called left aside", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ settings: { autoSyncHours: null, staleAfterWeeks: 6 } }))
      .mockResolvedValueOnce(jsonResponse({ settings: { autoSyncHours: null, staleAfterWeeks: 4 } }));

    render(<UserSettingsSections />);
    const field = (await screen.findByLabelText("Semaines sans jouer avant le rappel")) as HTMLInputElement;
    expect(field.value).toBe("6");

    fireEvent.change(field, { target: { value: "4" } });
    fireEvent.blur(field);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(fetchSpy.mock.calls[1][1]).toMatchObject({ body: JSON.stringify({ staleAfterWeeks: 4 }) });
  });

  it("does not save a number of weeks out of range", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse({ settings: { autoSyncHours: null, staleAfterWeeks: 6 } }));

    render(<UserSettingsSections />);
    const field = (await screen.findByLabelText("Semaines sans jouer avant le rappel")) as HTMLInputElement;
    fireEvent.change(field, { target: { value: "99" } });
    fireEvent.blur(field);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(field.value).toBe("6");
  });
});
