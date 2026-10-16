import { Loader2 } from "lucide-react";

export function GameClientLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30">
        <Loader2 className="h-7 w-7 animate-spin text-sky-400" />
      </div>
      <h3 className="text-base font-bold text-white">
        Récupération des succès en français...
      </h3>
      <p className="text-xs text-slate-400 max-w-xs">
        Extraction des noms officiels, icônes, descriptions et guides pas-à-pas.
      </p>
    </div>
  );
}
