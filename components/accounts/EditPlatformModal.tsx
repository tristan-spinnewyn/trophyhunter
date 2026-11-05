// components/accounts/EditPlatformModal.tsx

"use client";

import type { PlatformType } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import { PlatformStatsInputs } from "./platform-modal/PlatformStatsInputs";
import { Modal } from "@/components/ui/Modal";
import type { PlatformFormData } from "@/lib/platform-account-form";

interface EditPlatformModalProps {
  editingPlatform: PlatformType | null;
  onClose: () => void;
  platForm: PlatformFormData;
  setPlatForm: (val: PlatformFormData) => void;
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
            <label htmlFor="platform-username" className="text-sm font-medium text-paper-dim">
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
              className="mt-1 w-full rounded-control border border-seam bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lamp"
            />
          </div>

          <PlatformStatsInputs
            editingPlatform={editingPlatform}
            platForm={platForm}
            setPlatForm={setPlatForm}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-edge pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-control border border-seam px-3 py-2 text-sm text-paper-dim hover:bg-edge"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-control bg-lamp px-4 py-2 text-sm font-semibold text-ink hover:bg-lamp-bright"
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
