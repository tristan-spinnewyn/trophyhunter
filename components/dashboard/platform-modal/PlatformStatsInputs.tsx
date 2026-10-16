// components/dashboard/platform-modal/PlatformStatsInputs.tsx

import type { PlatformType } from "@/lib/types";
import { PlatformTrophyInputs } from "./PlatformTrophyInputs";

interface PlatformStatsInputsProps {
  editingPlatform: PlatformType;
  platForm: {
    username: string;
    level: string;
    gamesOwned: string;
    totalAchievements: string;
    completedGames: string;
    gamerScore: string;
  };
  setPlatForm: (val: any) => void;
}

export function PlatformStatsInputs({
  editingPlatform,
  platForm,
  setPlatForm,
}: PlatformStatsInputsProps) {
  if (editingPlatform === "steam") return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-[11px] text-slate-400">
            Jeux possédés
          </label>
          <input
            type="number"
            min="0"
            value={platForm.gamesOwned}
            onChange={(e) =>
              setPlatForm({
                ...platForm,
                gamesOwned: e.target.value,
              })
            }
            placeholder="Ex: 45"
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-400">
            Niveau du compte
          </label>
          <input
            type="number"
            min="0"
            value={platForm.level}
            onChange={(e) =>
              setPlatForm({ ...platForm, level: e.target.value })
            }
            placeholder="Ex: 240"
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <PlatformTrophyInputs
        editingPlatform={editingPlatform}
        platForm={platForm}
        setPlatForm={setPlatForm}
      />
    </>
  );
}
