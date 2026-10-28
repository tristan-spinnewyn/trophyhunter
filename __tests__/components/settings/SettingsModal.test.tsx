// @vitest-environment jsdom
// __tests__/components/settings/SettingsModal.test.tsx
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { SettingsModalProps } from "@/components/settings/SettingsModal.types";

let state: Record<string, unknown>;

vi.mock("@/components/settings/useSettingsModalState", () => ({
  useSettingsModalState: () => state,
}));

const { default: SettingsModal } = await import("@/components/settings/SettingsModal");

function renderModal(overrides: Partial<SettingsModalProps> = {}) {
  const props: SettingsModalProps = { isOpen: true, onClose: vi.fn(), onDataReset: vi.fn(), ...overrides };
  const view = render(<SettingsModal {...props} />);
  return { props, ...view };
}

describe("SettingsModal", () => {
  beforeEach(() => {
    state = {
      steamUser: "gabe", setSteamUser: vi.fn(),
      steamApiKey: "", setSteamApiKey: vi.fn(),
      steamSaved: false,
      statusMsg: null,
      copied: false,
      importText: "", setImportText: vi.fn(),
      handleSaveSteamUser: vi.fn(),
      handleExport: vi.fn(),
      handleDownload: vi.fn(),
      handleImport: vi.fn(),
      handleClearAll: vi.fn(),
    };
  });
  afterEach(cleanup);

  it("renders nothing while closed", () => {
    const { container } = renderModal({ isOpen: false });

    expect(container.innerHTML).toBe("");
  });

  it("edits and saves the Steam settings", () => {
    renderModal();

    fireEvent.change(screen.getByPlaceholderText(/gabelogannewell/), { target: { value: "gaben" } });
    fireEvent.change(screen.getByPlaceholderText(/Collez votre clé API Steam/), { target: { value: "KEY" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(state.setSteamUser).toHaveBeenCalledWith("gaben");
    expect(state.setSteamApiKey).toHaveBeenCalledWith("KEY");
    expect(state.handleSaveSteamUser).toHaveBeenCalled();
  });

  it("exports, downloads, imports and clears the backup", () => {
    state.importText = "{}";
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Copier les données (JSON)" }));
    fireEvent.click(screen.getByRole("button", { name: "Télécharger le fichier .json" }));
    fireEvent.change(screen.getByPlaceholderText(/Collez ici votre code JSON/), { target: { value: '{"a":1}' } });
    fireEvent.click(screen.getByRole("button", { name: "Importer et appliquer" }));
    fireEvent.click(screen.getByRole("button", { name: "Effacer toutes les données locales" }));

    expect(state.handleExport).toHaveBeenCalled();
    expect(state.handleDownload).toHaveBeenCalled();
    expect(state.setImportText).toHaveBeenCalledWith('{"a":1}');
    expect(state.handleImport).toHaveBeenCalled();
    expect(state.handleClearAll).toHaveBeenCalled();
  });

  it("blocks an empty import", () => {
    renderModal();

    expect((screen.getByRole("button", { name: "Importer et appliquer" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the success or error status", () => {
    state.statusMsg = { type: "success", text: "Données importées" };
    renderModal();
    expect(screen.getByText("Données importées")).toBeTruthy();
    cleanup();

    state.statusMsg = { type: "error", text: "JSON invalide" };
    renderModal();
    expect(screen.getByText("JSON invalide").parentElement?.className).toContain("text-rose-400");
  });
});
