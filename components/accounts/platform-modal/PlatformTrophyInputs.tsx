// components/accounts/platform-modal/PlatformTrophyInputs.tsx

import type { PlatformType } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import type { PlatformFormData } from "@/lib/platform-account-form";

interface PlatformTrophyInputsProps {
  editingPlatform: PlatformType;
  platForm: PlatformFormData;
  setPlatForm: (val: PlatformFormData) => void;
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
          <label className="text-[11px] text-dust">
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
            className="mt-1 w-full rounded-control border border-edge bg-ink px-3 py-2 text-xs text-paper outline-none focus:border-lamp"
          />
        </div>
        <div>
          <label className="text-[11px] text-dust">
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
            className="mt-1 w-full rounded-control border border-edge bg-ink px-3 py-2 text-xs text-paper outline-none focus:border-lamp"
          />
        </div>
      </div>

      {editingPlatform === "xbox" && (
        <div>
          <label className="text-[11px] text-dust">
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
            className="mt-1 w-full rounded-control border border-edge bg-ink px-3 py-2 text-xs text-paper outline-none focus:border-lamp"
          />
        </div>
      )}
    </>
  );
}
