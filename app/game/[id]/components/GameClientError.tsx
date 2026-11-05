import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface GameClientErrorProps {
  error: string | null;
}

export function GameClientError({ error }: GameClientErrorProps) {
  return (
    <div className="rounded-2xl border border-danger/30 bg-danger/10 p-8 text-center space-y-4 my-8">
      <AlertCircle className="h-10 w-10 text-danger mx-auto" />
      <h3 className="text-base font-bold text-paper">
        Oups ! Une erreur est survenue
      </h3>
      <p className="text-xs text-danger">{error || "Jeu introuvable"}</p>
      <div className="flex items-center justify-center gap-2 pt-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-xl border border-seam bg-edge px-4 py-2 text-xs font-semibold text-paper hover:bg-seam"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la bibliothèque
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-danger px-4 py-2 text-xs font-semibold text-paper hover:bg-danger transition"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
