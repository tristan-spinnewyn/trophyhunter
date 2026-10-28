// components/ui/useCloseOnEscape.ts

import { useEffect } from "react";

export function useCloseOnEscape(isActive: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onClose]);
}
