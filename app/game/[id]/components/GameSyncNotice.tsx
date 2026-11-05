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
          ? "border-done/30 bg-done/10 text-done"
          : "border-danger/30 bg-danger/10 text-danger"
      }`}
    >
      {notice.type === "success" ? (
        <Check className="h-4 w-4 shrink-0 text-done" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
      )}
      <span className="flex-1 font-medium">{notice.msg}</span>
    </div>
  );
}
