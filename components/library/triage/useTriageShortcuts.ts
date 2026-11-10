// components/library/triage/useTriageShortcuts.ts

import { useEffect } from "react";
import type { GameStatus } from "@/lib/types";
import { TRIAGE_DESTINATIONS, TRIAGE_SKIP_SHORTCUT } from "./triageDestinations";

interface TriageShortcutHandlers {
  readonly isActive: boolean;
  readonly suggestedStatus: GameStatus | null;
  readonly onChoose: (status: GameStatus) => void;
  readonly onSkip: () => void;
}

/** One letter per destination, S to skip, Enter to accept the suggestion. */
export function useTriageShortcuts({ isActive, suggestedStatus, onChoose, onSkip }: TriageShortcutHandlers) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "Enter") {
        // On a focused button, Enter already clicks it: accepting the suggestion too would sort twice.
        if (event.target instanceof HTMLButtonElement || !suggestedStatus) return;
        onChoose(suggestedStatus);
        return;
      }

      const key = event.key.toLowerCase();
      if (key === TRIAGE_SKIP_SHORTCUT) return onSkip();
      const destination = TRIAGE_DESTINATIONS.find((d) => d.shortcut === key);
      if (destination) onChoose(destination.status);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, suggestedStatus, onChoose, onSkip]);
}
