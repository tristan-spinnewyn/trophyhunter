// components/dashboard/EditPlatformModal.tsx

"use client";

import type { PlatformType } from "@/lib/types";
import { PLATFORM_META } from "@/lib/storage";
import { PlatformStatsInputs } from "./platform-modal/PlatformStatsInputs";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">
            Compte {PLATFORM_META[editingPlatform].name}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-semibold text-slate-300">
              Identifiant / Pseudo (sans clé API)
            </label>
            <input
              type="text"
              value={platForm.username}
              onChange={(e) =>
                setPlatForm({ ...platForm, username: e.target.value })
              }
              placeholder={PLATFORM_META[editingPlatform].placeholder}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
            />
          </div>

          <PlatformStatsInputs
            editingPlatform={editingPlatform}
            platForm={platForm}
            setPlatForm={setPlatForm}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
          >
            {editingPlatform === "steam"
              ? "Synchroniser Steam"
              : "Enregistrer le compte"}
          </button>
        </div>
      </div>
    </div>
  );
}
