// components/ui/confirm/ConfirmProvider.tsx
"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmContext } from "./useConfirm";
import { useConfirmQueue } from "./useConfirmQueue";

export function ConfirmProvider({ children }: { readonly children: ReactNode }) {
  const { request, ask, settle } = useConfirmQueue();
  const destructive = request?.destructive ?? true;

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {request && (
        <Modal title={request.title} onClose={() => settle(false)} size="sm">
          <p className="text-sm text-paper-dim">{request.message}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => settle(false)}
              className="rounded-control border border-seam px-3.5 py-2 text-sm text-paper-dim hover:bg-edge"
            >
              Annuler
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => settle(true)}
              className={`rounded-control px-3.5 py-2 text-sm font-semibold ${
                destructive
                  ? "bg-danger text-paper hover:bg-danger"
                  : "bg-lamp text-ink hover:bg-lamp-bright"
              }`}
            >
              {request.confirmLabel}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}
