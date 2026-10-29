// @vitest-environment jsdom
// __tests__/components/accounts/EditPlatformModal.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import EditPlatformModal from "@/components/accounts/EditPlatformModal";
import { INITIAL_PLATFORM_FORM } from "@/lib/platform-account-form";

const platForm = {
  ...INITIAL_PLATFORM_FORM,
  username: "chief",
  level: "10",
  gamesOwned: "45",
  totalAchievements: "1250",
  completedGames: "12",
  gamerScore: "42500",
};

function renderModal(overrides: Partial<ComponentProps<typeof EditPlatformModal>> = {}) {
  const props: ComponentProps<typeof EditPlatformModal> = {
    editingPlatform: "xbox",
    onClose: vi.fn(),
    platForm,
    setPlatForm: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  };
  const view = render(<EditPlatformModal {...props} />);
  return { props, ...view };
}

describe("EditPlatformModal", () => {
  afterEach(cleanup);

  it("renders nothing without a platform to edit", () => {
    const { container } = renderModal({ editingPlatform: null });

    expect(container.innerHTML).toBe("");
  });

  it("edits every Xbox field, gamerscore included", () => {
    const { props } = renderModal();
    const edits: [string, string, string][] = [
      ["Identifiant / pseudo", "username", "master"],
      ["Ex: 45", "gamesOwned", "50"],
      ["Ex: 240", "level", "11"],
      ["Ex: 1250", "totalAchievements", "1300"],
      ["Ex: 12", "completedGames", "13"],
      ["Ex: 42500", "gamerScore", "43000"],
    ];

    for (const [field, key, value] of edits) {
      const input = field.startsWith("Ex:") ? screen.getByPlaceholderText(field) : screen.getByLabelText(field);
      fireEvent.change(input, { target: { value } });
      expect(props.setPlatForm).toHaveBeenLastCalledWith({ ...platForm, [key]: value });
    }
  });

  it("saves or cancels", () => {
    const { props } = renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le compte" }));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(props.onSave).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });

  it("only asks for the identifier on Steam, which syncs its stats", () => {
    renderModal({ editingPlatform: "steam" });

    expect(screen.queryByPlaceholderText("Ex: 45")).toBeNull();
    expect(screen.getByRole("button", { name: "Synchroniser Steam" })).toBeTruthy();
  });

  it("hides the gamerscore outside Xbox", () => {
    renderModal({ editingPlatform: "gog" });

    expect(screen.getByPlaceholderText("Ex: 1250")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Ex: 42500")).toBeNull();
  });
});
