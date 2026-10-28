// components/ui/confirm/useConfirmQueue.ts

import { useCallback, useRef, useState } from "react";

export interface ConfirmOptions {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  /** Destructive actions get a red confirm button. Defaults to true: most confirmations guard a removal. */
  readonly destructive?: boolean;
}

/** One confirmation at a time, answered through a promise like `window.confirm`. */
export function useConfirmQueue() {
  const [request, setRequest] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((answer: boolean) => void) | null>(null);

  const settle = useCallback((answer: boolean) => {
    resolveRef.current?.(answer);
    resolveRef.current = null;
    setRequest(null);
  }, []);

  const ask = useCallback((options: ConfirmOptions) => {
    resolveRef.current?.(false);
    setRequest(options);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  return { request, ask, settle };
}
