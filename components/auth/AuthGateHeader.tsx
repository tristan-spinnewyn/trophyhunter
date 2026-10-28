// components/auth/AuthGateHeader.tsx

import { Trophy, Gamepad2, Sparkles } from "lucide-react";

export function AuthGateHeader({ legacyGamesCount }: { legacyGamesCount: number }) {
  return (
    <div className="text-center space-y-3">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600">
        <Trophy className="h-9 w-9 text-slate-950 stroke-[2.5]" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white flex items-center justify-center gap-2">
        TrophyHunter
        <span className="rounded-lg bg-sky-500/20 px-2 py-0.5 text-xs font-bold text-sky-400 border border-sky-500/30">
          SQLite
        </span>
      </h1>
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
        Votre tracker de succès tout-en-un pour Steam, Xbox, Epic Games et GOG.
      </p>

      {legacyGamesCount > 0 && (
        <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs text-amber-300">
          <Sparkles className="h-4 w-4" />
          <span>
            <strong>{legacyGamesCount} jeux détectés</strong> dans votre navigateur prêts à être migrés !
          </span>
        </div>
      )}
    </div>
  );
}
