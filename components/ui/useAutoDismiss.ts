// components/ui/useAutoDismiss.ts

import { useEffect } from "react";

/** Calls `onDismiss` after `delayMs` while active; `resetKey` restarts the delay (e.g. a new message). */
export function useAutoDismiss(isActive: boolean, onDismiss: () => void, delayMs: number, resetKey?: unknown) {
  useEffect(() => {
    if (!isActive) return;
    const timer = setTimeout(onDismiss, delayMs);
    return () => clearTimeout(timer);
    // onDismiss is usually an inline callback; restarting on each render would never let it fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, delayMs, resetKey]);
}
