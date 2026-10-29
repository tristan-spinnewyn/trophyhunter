// @vitest-environment jsdom
// __tests__/components/auth/AuthFormFields.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthFormFields } from "@/components/auth/AuthFormFields";
import { MIN_PASSWORD_LENGTH } from "@/lib/accounts/password-policy";

function renderFields(mode: "login" | "register") {
  render(
    <AuthFormFields
      mode={mode}
      username="" setUsername={vi.fn()}
      password="" setPassword={vi.fn()}
      displayName="" setDisplayName={vi.fn()}
    />
  );
  return document.querySelector('input[type="password"]') as HTMLInputElement;
}

describe("AuthFormFields", () => {
  it("requires the shared minimum password length when signing up", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    const input = renderFields("register");

    expect(input.minLength).toBe(MIN_PASSWORD_LENGTH);
    expect(screen.getByText(/Minimum 8 caractères/)).toBeTruthy();
  });

  it("does not block sign-in for accounts created with a shorter password", () => {
    const input = renderFields("login");

    expect(input.minLength).toBe(-1);
    expect(screen.queryByText(/Minimum/)).toBeNull();
  });
});
