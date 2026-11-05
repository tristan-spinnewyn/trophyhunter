// components/library/shelf/GamePeekDialog.tsx

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";

interface GamePeekDialogProps {
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

/** A game taken off the shelf: its full card, with every action, without leaving the collection. */
export function GamePeekDialog({ title, onClose, children }: GamePeekDialogProps) {
  return (
    <Modal title={title} onClose={onClose} size="sm">
      {children}
    </Modal>
  );
}
