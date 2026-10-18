// components/progress/ProgressTracker.types.ts

export interface ProgressTrackerProps {
  readonly total: number;
  readonly unlockedCount: number;
  readonly onReset: () => void;
  readonly onSync?: () => void;
  readonly isSyncing?: boolean;
  readonly hasSteamUser?: boolean;
  readonly platform?: "steam" | "epic" | "xbox" | "gog";
  readonly platformConnected?: boolean;
  readonly onOpenEpicModal?: () => void;
}

export interface ProgressTier {
  readonly name: string;
  readonly color: string;
}
