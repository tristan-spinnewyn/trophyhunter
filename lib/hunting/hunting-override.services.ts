// lib/hunting/hunting-override.services.ts

import {
  type GameHuntingOverride,
  type HuntingWarningType,
  InvalidHuntingMetaError,
} from "./hunting.types";
import { isValidHuntingWarningType } from "./hunting-warning.services";

export function validateHuntingOverride(raw: unknown): GameHuntingOverride {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const record = raw as Record<string, unknown>;
  let difficultyRating: number | undefined;
  let estimatedHours: number | undefined;
  let minPlaythroughs: number | undefined;
  let warningType: HuntingWarningType | undefined;
  let warningMessage: string | undefined;

  if (record.difficultyRating !== undefined) {
    const val = Number(record.difficultyRating);
    if (!Number.isFinite(val) || val < 1 || val > 10) {
      throw new InvalidHuntingMetaError("difficultyRating", "Must be between 1 and 10");
    }
    difficultyRating = Math.round(val);
  }

  if (record.estimatedHours !== undefined) {
    const val = Number(record.estimatedHours);
    if (!Number.isFinite(val) || val < 1 || val > 2000) {
      throw new InvalidHuntingMetaError("estimatedHours", "Must be between 1 and 2000");
    }
    estimatedHours = Math.round(val);
  }

  if (record.minPlaythroughs !== undefined) {
    const val = Number(record.minPlaythroughs);
    if (!Number.isFinite(val) || val < 1 || val > 20) {
      throw new InvalidHuntingMetaError("minPlaythroughs", "Must be between 1 and 20");
    }
    minPlaythroughs = Math.round(val);
  }

  if (record.warningType !== undefined) {
    if (!isValidHuntingWarningType(record.warningType)) {
      throw new InvalidHuntingMetaError("warningType", "Unsupported warning type");
    }
    warningType = record.warningType;
  }

  if (typeof record.warningMessage === "string" && record.warningMessage.trim().length > 0) {
    warningMessage = record.warningMessage.trim().slice(0, 240);
  }

  return {
    ...(difficultyRating !== undefined ? { difficultyRating } : {}),
    ...(estimatedHours !== undefined ? { estimatedHours } : {}),
    ...(minPlaythroughs !== undefined ? { minPlaythroughs } : {}),
    ...(warningType !== undefined ? { warningType } : {}),
    ...(warningMessage !== undefined ? { warningMessage } : {}),
  };
}

export function sanitizeHuntingOverrideSafe(raw: unknown): GameHuntingOverride | undefined {
  try {
    const validated = validateHuntingOverride(raw);
    return Object.keys(validated).length > 0 ? validated : undefined;
  } catch {
    return undefined;
  }
}

export function getDefaultWarningMessageForType(type: HuntingWarningType): string | null {
  if (type === "unobtainable") {
    return "Platine / 100% signalé comme inobtenable (serveurs fermés ou succès retiré).";
  }
  if (type === "bugged") {
    return "Un ou plusieurs succès sont signalés comme buggés sur cette version.";
  }
  if (type === "online-required") {
    return "Succès multijoueur / connexion en ligne requis pour le 100%.";
  }
  return null;
}
