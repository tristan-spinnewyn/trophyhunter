// app/game/[id]/hooks/useGameResumeNote.ts
"use client";

import { useOwnedGamePatch, type UseOwnedGamePatchProps } from "./useOwnedGamePatch";

/** Notes where the owner left off in the page's game: shown at once, saved for a signed-in user, undone if the save fails. */
export function useGameResumeNote(props: UseOwnedGamePatchProps) {
  const patchOwnedGame = useOwnedGamePatch(props);

  const handleSaveResumeNote = (note: string | null) =>
    patchOwnedGame({ resumeNote: note ?? undefined }, { resumeNote: note });

  return { handleSaveResumeNote };
}
