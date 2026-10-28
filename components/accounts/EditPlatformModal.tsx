// components/accounts/EditPlatformModal.tsx

"use client";

import type { PlatformType } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import { PlatformStatsInputs } from "./platform-modal/PlatformStatsInputs";
import { Modal } from "@/components/ui/Modal";

interface EditPlatformModalProps {
  editingPlatform: PlatformType | null;
  onClose: () => void;
  platForm: {
    username: string;
    level: string;
    gamesOwned: string;
    totalAchievements: string;
    completedGames: string;
    gamerScore: string;
  };
  setPlatForm: (val: any) => void;
  onSave: () => void;
}

export default function EditPlatformModal({
  editingPlatform,
  onClose,
  platForm,
  setPlatForm,
  onSave,
}: EditPlatformModalProps) {
  if (!editingPlatform) return null;

  return (
    <Modal title={`Compte ${PLATFORM_META[editingPlatform].name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <label htmlFor="platform-username" className="text-sm font-medium text-slate-300">
              Identifiant / pseudo
            </label>
            <input
              id="platform-username"
              type="text"
              value={platForm.username}
              onChange={(e) =>
                setPlatForm({ ...platForm, username: e.target.value })
              }
              placeholder={PLATFORM_META[editingPlatform].placeholder}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
            />
          </div>

          <PlatformStatsInputs
            editingPlatform={editingPlatform}
            platForm={platForm}
            setPlatForm={setPlatForm}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
          >
            {editingPlatform === "steam"
              ? "Synchroniser Steam"
              : "Enregistrer le compte"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
