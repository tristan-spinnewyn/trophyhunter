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
          <p className="text-sm text-slate-300">{request.message}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => settle(false)}
              className="rounded-lg border border-slate-700 px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Annuler
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => settle(true)}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${
                destructive
                  ? "bg-rose-500 text-white hover:bg-rose-400"
                  : "bg-sky-500 text-slate-950 hover:bg-sky-400"
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
