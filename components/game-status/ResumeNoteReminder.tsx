// components/game-status/ResumeNoteReminder.tsx
import type { OwnedGame } from "@/lib/types";
import { canHaveResumeNote, describeResumeNote } from "@/lib/game-resume/resume-note";

interface ResumeNoteReminderProps {
  readonly game: Pick<OwnedGame, "status" | "resumeNote">;
  readonly className?: string;
}

/** "Où tu en étais : …" on a game being played or paused; nothing otherwise. */
export function ResumeNoteReminder({ game, className = "" }: ResumeNoteReminderProps) {
  const text = canHaveResumeNote(game.status) ? describeResumeNote(game.resumeNote) : null;
  if (!text) return null;
  return <p className={`text-sm text-paper-dim ${className}`}>{text}</p>;
}
