// components/ui/Modal.tsx
"use client";

import { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { useCloseOnEscape } from "./useCloseOnEscape";

type ModalSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

interface ModalProps {
  readonly title: ReactNode;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly icon?: ReactNode;
  readonly size?: ModalSize;
}

/** Dialog shell: bottom sheet on phones, centered card from `sm` up. Closes on Escape and backdrop click. */
export function Modal({ title, onClose, children, icon, size = "md" }: ModalProps) {
  const titleId = useId();
  useCloseOnEscape(true, onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-slate-800 bg-slate-900 pb-[env(safe-area-inset-bottom)] sm:rounded-2xl sm:pb-0 ${SIZE_CLASS[size]}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-3.5">
          <h2 id={titleId} className="flex min-w-0 items-center gap-2 text-base font-semibold text-white">
            {icon}
            <span className="truncate">{title}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
