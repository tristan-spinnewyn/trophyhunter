// components/epic-modal/EpicAuthInstructions.tsx

import { ExternalLink } from "lucide-react";
import { EPIC_AUTH_CODE_URL } from "@/lib/epic/auth-input";

export const EPIC_AUTH_URL = EPIC_AUTH_CODE_URL;

export function EpicAuthInstructions() {
  return (
    <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-4 space-y-3 text-xs">
      <p className="font-semibold text-purple-200">
        Pour synchroniser vos succès officiels avec Epic Games :
      </p>
      <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
        <li>Ouvrez la page officielle d&apos;autorisation Epic Games en un clic :</li>
        <li className="list-none pl-4 pt-1">
          <a
            href={EPIC_AUTH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600/30 border border-purple-500/50 px-3 py-1.5 font-bold text-purple-200 hover:bg-purple-600/50 hover:text-white transition shadow-sm"
          >
            <span>Ouvrir la page d&apos;autorisation Epic</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </li>
        <li className="pt-1">
          Connectez-vous sur <span className="font-mono text-purple-300">epicgames.com</span> si demandé.
        </li>
        <li>
          Copiez tout le texte JSON affiché (ou la valeur de <span className="font-mono text-purple-300">&quot;authorizationCode&quot;</span>) et collez-le ci-dessous.
        </li>
      </ol>
    </div>
  );
}
