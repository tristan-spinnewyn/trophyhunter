// @vitest-environment jsdom
// __tests__/components/ui/useConfirmQueue.test.ts
import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useConfirmQueue } from "@/components/ui/confirm/useConfirmQueue";

const removeGame = { title: "Retirer le jeu ?", message: "Celeste sera retiré.", confirmLabel: "Retirer" };

describe("useConfirmQueue", () => {
  it("has no pending request at first", () => {
    const { result } = renderHook(() => useConfirmQueue());

    expect(result.current.request).toBeNull();
  });

  it("exposes the request until it is answered, then resolves true on confirm", async () => {
    const { result } = renderHook(() => useConfirmQueue());

    let answer!: Promise<boolean>;
    act(() => {
      answer = result.current.ask(removeGame);
    });
    expect(result.current.request).toMatchObject(removeGame);

    act(() => result.current.settle(true));

    await expect(answer).resolves.toBe(true);
    expect(result.current.request).toBeNull();
  });

  it("resolves false when the user cancels", async () => {
    const { result } = renderHook(() => useConfirmQueue());

    let answer!: Promise<boolean>;
    act(() => {
      answer = result.current.ask(removeGame);
    });
    act(() => result.current.settle(false));

    await expect(answer).resolves.toBe(false);
  });

  it("cancels a pending request when a new one replaces it", async () => {
    const { result } = renderHook(() => useConfirmQueue());

    let first!: Promise<boolean>;
    act(() => {
      first = result.current.ask(removeGame);
    });
    act(() => {
      void result.current.ask({ ...removeGame, title: "Délier le compte ?" });
    });

    await expect(first).resolves.toBe(false);
    expect(result.current.request?.title).toBe("Délier le compte ?");
  });

  it("ignores an answer when nothing is pending", () => {
    const { result } = renderHook(() => useConfirmQueue());

    expect(() => act(() => result.current.settle(true))).not.toThrow();
  });
});
