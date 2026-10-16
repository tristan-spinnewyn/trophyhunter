// components/progress/ProgressTracker.types.ts

export interface ProgressTrackerProps {
  total: number;
  unlockedCount: number;
  onReset: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  hasSteamUser?: boolean;
  platform?: "steam" | "epic" | "xbox" | "gog";
  platformConnected?: boolean;
  onOpenEpicModal?: () => void;
}

export interface ProgressTier {
  name: string;
  color: string;
}
