// components/auth/AuthGateHeader.tsx

export function AuthGateHeader({ legacyGamesCount }: { legacyGamesCount: number }) {
  return (
    <div className="w-full space-y-4">
      <h1 className="font-wide text-5xl font-extrabold leading-[0.92] tracking-[-0.035em] text-paper sm:text-6xl">
        TrophyHunter
      </h1>
      <p className="max-w-[46ch] text-[17px] text-dust">
        Ce que tu joues, ce qui t&apos;attend, ce que tu as fini. Sur Steam, Xbox, Epic Games et GOG.
      </p>
      <div aria-hidden className="shelf-board shelf-board-lit" />

      {legacyGamesCount > 0 && (
        <p className="text-sm text-paper-dim">
          <strong className="font-semibold text-paper">{legacyGamesCount} jeux détectés</strong> dans ce navigateur, prêts
          à rejoindre ta collection.
        </p>
      )}
    </div>
  );
}
