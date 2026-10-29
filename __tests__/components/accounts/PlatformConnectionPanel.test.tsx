// @vitest-environment jsdom
// __tests__/components/accounts/PlatformConnectionPanel.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  PlatformConnectionPanel,
  type PlatformConnectionPanelProps,
} from "@/components/accounts/PlatformConnectionPanel";
import type { PlatformAccount } from "@/lib/types";

function makeAccount(overrides: Partial<PlatformAccount> = {}): PlatformAccount {
  return {
    platform: "steam",
    username: "gabe",
    displayName: "Gabe N.",
    avatarUrl: "https://example.test/avatar.jpg",
    profileUrl: "https://steamcommunity.com/id/gabe",
    connectedAt: "2026-01-01T00:00:00.000Z",
    lastSyncedAt: "2026-03-15T12:00:00.000Z",
    stats: { gamesOwned: 40, totalAchievements: 900, completedGames: 7, badges: 12, dlcCount: 3 },
    ...overrides,
  };
}

function renderPanel(overrides: Partial<PlatformConnectionPanelProps> = {}) {
  const props: PlatformConnectionPanelProps = {
    platform: "steam",
    gameCount: 0,
    identifier: "",
    onIdentifierChange: vi.fn(),
    secret: "",
    onSecretChange: vi.fn(),
    isSyncing: false,
    syncProgressText: null,
    onSync: vi.fn(),
    onEdit: vi.fn(),
    onDisconnect: vi.fn(),
    ...overrides,
  };
  render(<PlatformConnectionPanel {...props} />);
  return props;
}

function tileValue(label: string) {
  return screen.getByText(label).nextElementSibling?.textContent;
}

describe("PlatformConnectionPanel", () => {
  afterEach(cleanup);

  it("describes an unlinked platform and invites an import", () => {
    renderPanel();

    expect(screen.getByRole("heading", { name: "Steam" })).toBeTruthy();
    expect(screen.getByText("Non lié")).toBeTruthy();
    expect(screen.getByText(/Importe tes jeux, ton temps de jeu/)).toBeTruthy();
    expect(screen.getByText(/Aucun jeu Steam dans ta collection/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Importer" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Délier/ })).toBeNull();
    expect(tileValue("Succès débloqués")).toBe("0");
  });

  it("shows a linked account with its profile, last sync and stats", () => {
    renderPanel({ account: makeAccount(), gameCount: 2 });

    expect(screen.getByRole("heading", { name: "Gabe N." })).toBeTruthy();
    expect(screen.getByText("Lié")).toBeTruthy();
    expect(screen.getByText("Dernière synchro le 15/03/2026")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Voir le profil Steam/ }).getAttribute("href")).toBe(
      "https://steamcommunity.com/id/gabe"
    );
    expect(screen.getByRole("link", { name: /Voir mes 2 jeux Steam/ }).getAttribute("href")).toBe("/?tab=steam");
    expect(tileValue("Succès débloqués")).toBe("900");
    expect(tileValue("Jeux à 100 %")).toBe("7");
    expect(screen.getByText("Badges Steam")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Synchroniser" })).toBeTruthy();
  });

  it("edits and disconnects the account", () => {
    const props = renderPanel({ account: makeAccount() });

    fireEvent.click(screen.getByRole("button", { name: /Modifier à la main/ }));
    fireEvent.click(screen.getByRole("button", { name: /Délier/ }));

    expect(props.onEdit).toHaveBeenCalledWith("steam");
    expect(props.onDisconnect).toHaveBeenCalledWith("steam");
  });

  it("syncs on submit once an identifier is entered", () => {
    const props = renderPanel({ identifier: "gabe" });

    fireEvent.change(screen.getByLabelText("SteamID, pseudo ou URL de profil"), { target: { value: "gaben" } });
    fireEvent.click(screen.getByRole("button", { name: "Importer" }));

    expect(props.onIdentifierChange).toHaveBeenCalledWith("gaben");
    expect(props.onSync).toHaveBeenCalled();
  });

  it("does not sync without the required identifier", () => {
    const props = renderPanel();

    const button = screen.getByRole("button", { name: "Importer" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.submit(button.closest("form")!);

    expect(props.onSync).not.toHaveBeenCalled();
  });

  it("reports the sync progress", () => {
    renderPanel({ identifier: "gabe", isSyncing: true, syncProgressText: "12 / 40 jeux" });

    expect(screen.getByRole("status").textContent).toBe("12 / 40 jeux");
  });

  it("keeps the secret section open when a secret is set and forwards edits", () => {
    const props = renderPanel({ platform: "xbox", secret: "key" });

    expect(document.querySelector("details")!.open).toBe(true);
    expect(screen.getByText("renseigné")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Clé OpenXBL"), { target: { value: "new-key" } });

    expect(props.onSecretChange).toHaveBeenCalledWith("new-key");
  });

  it("shows that a key is saved on the server without revealing it", () => {
    renderPanel({
      platform: "xbox",
      secret: "",
      account: {
        platform: "xbox", username: "x", displayName: "X", connectedAt: "x", hasApiKey: true,
        stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 },
      },
    });

    expect(screen.getByText("enregistrée")).toBeTruthy();
    expect((screen.getByLabelText("Clé OpenXBL") as HTMLInputElement).value).toBe("");
  });

  it("extracts the Epic code from a pasted JSON response and offers the guided flow", () => {
    const onOpenGuidedAuth = vi.fn();
    const props = renderPanel({ platform: "epic", onOpenGuidedAuth });

    fireEvent.change(screen.getByLabelText("Code d'autorisation Epic"), {
      target: { value: JSON.stringify({ authorizationCode: "abc123" }) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Me guider pas à pas" }));

    expect(props.onSecretChange).toHaveBeenCalledWith("abc123");
    expect(onOpenGuidedAuth).toHaveBeenCalled();
  });

  it("lets Epic sync without an identifier", () => {
    renderPanel({ platform: "epic" });

    expect((screen.getByRole("button", { name: "Importer" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("falls back to an icon when the avatar URL is not safe", () => {
    renderPanel({ account: makeAccount({ avatarUrl: "javascript:alert(1)", profileUrl: undefined }) });

    expect(document.querySelector("img")).toBeNull();
    expect(screen.queryByRole("link", { name: /Voir le profil/ })).toBeNull();
  });

  it("renders the platform-specific extra content", () => {
    renderPanel({ extra: <p>Outils Epic</p> });

    expect(screen.getByText("Outils Epic")).toBeTruthy();
  });
});
