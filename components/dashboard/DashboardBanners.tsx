import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface DashboardBannersProps {
  bannerMsg: {
    type: "success" | "error";
    text: string;
  } | null;
  onDismissBanner: () => void;
  syncProgressText: string | null;
}

export default function DashboardBanners({
  bannerMsg,
  onDismissBanner,
  syncProgressText,
}: DashboardBannersProps) {
  return (
    <>
      {bannerMsg && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-xs ${
            bannerMsg.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/40 bg-rose-500/10 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span className="font-medium">{bannerMsg.text}</span>
          </div>
          <button
            onClick={onDismissBanner}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {syncProgressText && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-sky-500/40 bg-sky-500/10 p-3 text-xs text-sky-200">
          <Loader2 className="h-4 w-4 animate-spin shrink-0 text-sky-400" />
          <span className="font-medium truncate">{syncProgressText}</span>
        </div>
      )}
    </>
  );
}
