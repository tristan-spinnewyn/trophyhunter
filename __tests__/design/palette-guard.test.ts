import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const SCANNED_DIRS = ["app", "components", "lib"];

/** Tailwind's stock palette: the Étagère design only uses its own named tokens. */
const LEGACY_COLOR_CLASS =
  /\b(?:[a-z-]+:)*(?:bg|text|border|ring|from|via|to|fill|stroke|divide|outline|placeholder|accent|shadow|decoration)-(?:slate|gray|zinc|neutral|stone|sky|blue|indigo|violet|purple|fuchsia|pink|rose|red|orange|amber|yellow|lime|green|emerald|teal|cyan)-\d{2,3}\b|\b(?:[a-z-]+:)*(?:text|bg|border)-(?:white|black)\b/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(tsx?|css)$/.test(entry) ? [full] : [];
  });
}

describe("Étagère palette guard", () => {
  it("uses only the named design tokens, never Tailwind's stock palette", () => {
    const offenders = SCANNED_DIRS.flatMap((dir) => sourceFiles(path.join(ROOT, dir)))
      .flatMap((file) => {
        const matches = readFileSync(file, "utf8").match(LEGACY_COLOR_CLASS) ?? [];
        return matches.map((m) => `${path.relative(ROOT, file)}: ${m}`);
      });

    expect(offenders).toEqual([]);
  });
});
