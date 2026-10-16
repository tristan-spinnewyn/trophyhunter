// components/settings/MobileInstallGuide.tsx

import { Smartphone } from "lucide-react";

export function MobileInstallGuide() {
  return (
    <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
        <Smartphone className="h-4 w-4" />
        Installer sur votre smartphone
      </h3>
      <p className="mt-1 text-xs text-slate-300">
        Pour utiliser TrophyHunter comme une vraie application sur votre mobile :
      </p>
      <ul className="mt-2 space-y-1 text-xs text-slate-400 list-disc list-inside">
        <li>
          <span className="font-semibold text-white">iPhone / iPad (Safari) :</span> Appuyez sur le bouton de partage (icône carré avec flèche vers le haut) puis sur{" "}
          <span className="text-sky-300 font-medium">« Sur l&apos;écran d&apos;accueil »</span>.
        </li>
        <li>
          <span className="font-semibold text-white">Android (Chrome) :</span> Appuyez sur les 3 points en haut à droite puis sur{" "}
          <span className="text-sky-300 font-medium">« Installer l&apos;application »</span>.
        </li>
      </ul>
    </div>
  );
}
