import { describe, it, expect } from "vitest";
import { textTabClassName } from "@/components/ui/textTab";

describe("textTabClassName", () => {
  it("underlines the active tab with the lamp colour", () => {
    expect(textTabClassName(true)).toContain("shadow-[inset_0_-2px_0_var(--lamp)]");
    expect(textTabClassName(true)).toContain("text-paper");
  });

  it("keeps inactive tabs quiet until hovered", () => {
    expect(textTabClassName(false)).toContain("text-dust");
    expect(textTabClassName(false)).not.toContain("var(--lamp)");
  });
});
