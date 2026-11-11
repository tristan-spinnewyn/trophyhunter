// components/settings/UserSettingsSections.tsx
"use client";

import { useUserSettings } from "./useUserSettings";
import { AutoSyncSettingsSection } from "./AutoSyncSettingsSection";
import { StaleReminderSettingsSection } from "./StaleReminderSettingsSection";

/** The settings stored on the server for the signed-in user; hidden for a signed-out visitor. */
export function UserSettingsSections() {
  const { settings, saveError, update } = useUserSettings();
  if (!settings) return null;

  const onChange = (changes: Parameters<typeof update>[0]) => void update(changes);

  return (
    <>
      <AutoSyncSettingsSection settings={settings} onChange={onChange} />
      <StaleReminderSettingsSection key={settings.staleAfterWeeks} settings={settings} onChange={onChange} />
      {saveError && <p className="text-[11px] text-danger">{saveError}</p>}
    </>
  );
}
