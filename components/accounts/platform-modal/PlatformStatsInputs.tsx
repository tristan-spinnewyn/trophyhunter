// components/accounts/platform-modal/PlatformStatsInputs.tsx

import type { PlatformType } from "@/lib/types";
import { PlatformTrophyInputs } from "./PlatformTrophyInputs";
import type { PlatformFormData } from "@/lib/platform-account-form";

interface PlatformStatsInputsProps {
  editingPlatform: PlatformType;
  platForm: PlatformFormData;
  setPlatForm: (val: PlatformFormData) => void;
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
          <label className="text-[11px] text-dust">
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
            className="mt-1 w-full rounded-xl border border-edge bg-ink px-3 py-2 text-xs text-paper outline-none focus:border-lamp"
          />
        </div>
        <div>
          <label className="text-[11px] text-dust">
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
            className="mt-1 w-full rounded-xl border border-edge bg-ink px-3 py-2 text-xs text-paper outline-none focus:border-lamp"
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
