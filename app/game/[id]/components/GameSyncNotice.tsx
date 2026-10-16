import { Check, AlertCircle } from "lucide-react";

interface GameSyncNoticeProps {
  notice: {
    type: "success" | "error";
    msg: string;
  } | null;
}

export function GameSyncNotice({ notice }: GameSyncNoticeProps) {
  if (!notice) return null;

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl p-3 text-xs border ${
        notice.type === "success"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-rose-500/30 bg-rose-500/10 text-rose-300"
      }`}
    >
      {notice.type === "success" ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
      )}
      <span className="flex-1 font-medium">{notice.msg}</span>
    </div>
  );
}
