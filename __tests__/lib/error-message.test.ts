// __tests__/lib/error-message.test.ts
import { describe, it, expect } from "vitest";
import { errorMessage, errorStatus, publicErrorMessage } from "@/lib/error-message";

describe("errorMessage", () => {
  it("returns the message of an Error", () => {
    expect(errorMessage(new Error("Disk full"), "fallback")).toBe("Disk full");
  });

  it.each([
    ["an Error without message", new Error("")],
    ["a thrown string", "boom"],
    ["undefined", undefined],
    ["a plain object", { message: 42 }],
  ])("falls back for %s", (_label, thrown) => {
    expect(errorMessage(thrown, "Erreur interne")).toBe("Erreur interne");
  });
});

describe("errorStatus", () => {
  it("returns the numeric status attached to an error", () => {
    expect(errorStatus(Object.assign(new Error("Not found"), { status: 404 }), 500)).toBe(404);
  });

  it.each([
    ["a plain Error", new Error("x")],
    ["a non-numeric status", Object.assign(new Error("x"), { status: "404" })],
    ["a zero status", Object.assign(new Error("x"), { status: 0 })],
    ["null", null],
  ])("falls back for %s", (_label, thrown) => {
    expect(errorStatus(thrown, 500)).toBe(500);
  });
});

describe("publicErrorMessage", () => {
  it("shows the message of an error raised on purpose for the client (status below 500)", () => {
    const err = Object.assign(new Error("Profil Steam privé."), { status: 403 });
    expect(publicErrorMessage(err, "Erreur interne")).toBe("Profil Steam privé.");
  });

  it.each([
    ["an unexpected Error", new Error("SQLITE_BUSY: database is locked")],
    ["an error flagged as a server error", Object.assign(new Error("Upstream exploded"), { status: 502 })],
    ["a thrown string", "boom"],
  ])("hides the message of %s behind the fallback", (_label, thrown) => {
    expect(publicErrorMessage(thrown, "Erreur interne")).toBe("Erreur interne");
  });
});
