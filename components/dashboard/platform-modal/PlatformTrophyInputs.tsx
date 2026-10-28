// components/dashboard/platform-modal/PlatformTrophyInputs.tsx

import type { PlatformType } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";

interface PlatformTrophyInputsProps {
  editingPlatform: PlatformType;
  platForm: {
    totalAchievements: string;
    completedGames: string;
    gamerScore: string;
  };
  setPlatForm: (val: any) => void;
}

export function PlatformTrophyInputs({
  editingPlatform,
  platForm,
  setPlatForm,
}: PlatformTrophyInputsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-[11px] text-slate-400">
            {PLATFORM_META[editingPlatform].trophyLabel} débloqués
          </label>
          <input
            type="number"
            min="0"
            value={platForm.totalAchievements}
            onChange={(e) =>
              setPlatForm({
                ...platForm,
                totalAchievements: e.target.value,
              })
            }
            placeholder="Ex: 1250"
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-400">
            {PLATFORM_META[editingPlatform].completeLabel}
          </label>
          <input
            type="number"
            min="0"
            value={platForm.completedGames}
            onChange={(e) =>
              setPlatForm({
                ...platForm,
                completedGames: e.target.value,
              })
            }
            placeholder="Ex: 12"
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {editingPlatform === "xbox" && (
        <div>
          <label className="text-[11px] text-slate-400">
            Gamerscore total (G)
          </label>
          <input
            type="number"
            min="0"
            value={platForm.gamerScore}
            onChange={(e) =>
              setPlatForm({
                ...platForm,
                gamerScore: e.target.value,
              })
            }
            placeholder="Ex: 42500"
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
          />
        </div>
      )}
    </>
  );
}
