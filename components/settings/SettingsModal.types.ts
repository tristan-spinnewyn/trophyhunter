// components/settings/SettingsModal.types.ts

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
  initialSteamUser?: string;
  initialSteamApiKey?: string;
  onSteamUserSaved?: (user: string, apiKey?: string) => void;
  onRefreshData?: () => Promise<void>;
}

export interface StatusMsg {
  type: "success" | "error";
  text: string;
}
