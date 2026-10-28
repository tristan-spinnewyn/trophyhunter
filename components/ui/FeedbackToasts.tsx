// components/ui/FeedbackToasts.tsx
"use client";

import { CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { useAutoDismiss } from "./useAutoDismiss";

const SUCCESS_TOAST_MS = 5000;

interface FeedbackToastsProps {
  bannerMsg: {
    type: "success" | "error";
    text: string;
  } | null;
  onDismissBanner: () => void;
  syncProgressText: string | null;
}

/** Floating feedback, visible wherever the user is on the page. Errors stay until closed. */
export default function FeedbackToasts({
  bannerMsg,
  onDismissBanner,
  syncProgressText,
}: FeedbackToastsProps) {
  useAutoDismiss(bannerMsg?.type === "success", onDismissBanner, SUCCESS_TOAST_MS, bannerMsg?.text);

  if (!bannerMsg && !syncProgressText) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6">
      {syncProgressText && (
        <div
          role="status"
          className="pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-sm text-slate-200 shadow-lg backdrop-blur"
        >
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-400" />
          <span className="truncate">{syncProgressText}</span>
        </div>
      )}

      {bannerMsg && (
        <div
          role={bannerMsg.type === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border bg-slate-900/95 p-3 text-sm shadow-lg backdrop-blur ${
            bannerMsg.type === "success" ? "border-emerald-500/40 text-slate-100" : "border-rose-500/50 text-rose-100"
          }`}
        >
          {bannerMsg.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span className="flex-1">{bannerMsg.text}</span>
          <button
            type="button"
            onClick={onDismissBanner}
            aria-label="Fermer"
            className="-m-1 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
