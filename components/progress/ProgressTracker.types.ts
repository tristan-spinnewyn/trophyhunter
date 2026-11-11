// components/progress/ProgressTracker.types.ts
import type { PlatformType } from "@/lib/types";

export interface ProgressTrackerProps {
  readonly total: number;
  readonly unlockedCount: number;
  /** Count reported by the platform import, used while the checklist is empty. */
  readonly importedUnlockedCount?: number;
  readonly onReset: () => void;
  readonly onSync?: () => void;
  readonly isSyncing?: boolean;
  readonly hasSteamUser?: boolean;
  readonly platform?: PlatformType;
  readonly platformConnected?: boolean;
  readonly onOpenEpicModal?: () => void;
}

export interface ProgressTier {
  readonly name: string;
  readonly color: string;
}
