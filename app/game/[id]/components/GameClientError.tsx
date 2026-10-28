import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface GameClientErrorProps {
  error: string | null;
}

export function GameClientError({ error }: GameClientErrorProps) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center space-y-4 my-8">
      <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
      <h3 className="text-base font-bold text-white">
        Oups ! Une erreur est survenue
      </h3>
      <p className="text-xs text-rose-300">{error || "Jeu introuvable"}</p>
      <div className="flex items-center justify-center gap-2 pt-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la bibliothèque
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
