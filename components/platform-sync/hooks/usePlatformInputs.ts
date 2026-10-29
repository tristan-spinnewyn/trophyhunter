// components/platform-sync/hooks/usePlatformInputs.ts

import { useState, useEffect } from "react";
import type { UserAccountProfile } from "@/lib/types";

/** Where earlier versions kept the Xbox API key in clear; now only removed, never written. */
const LEGACY_XBOX_API_KEY_STORAGE = "trophyhunter_xbox_api_key";

interface UsePlatformInputsProps {
  readonly accountProfile: UserAccountProfile;
  readonly initialSteamApiKey?: string;
}

export function usePlatformInputs({
  accountProfile,
  initialSteamApiKey = "",
}: UsePlatformInputsProps) {
  const steamAccount = accountProfile.accounts.steam;
  const xboxAccount = accountProfile.accounts.xbox;
  const epicAccount = accountProfile.accounts.epic;
  const gogAccount = accountProfile.accounts.gog;

  const [steamInput, setSteamInput] = useState(steamAccount?.username || "");
  const [steamApiKey, setSteamApiKey] = useState(initialSteamApiKey);

  const [xboxInput, setXboxInput] = useState(xboxAccount?.username || "");
  const [xboxApiKey, setXboxApiKey] = useState("");

  const [epicInput, setEpicInput] = useState(epicAccount?.username || "");
  const [epicCode, setEpicCode] = useState("");

  const [gogInput, setGogInput] = useState(gogAccount?.username || "");
  const [gogToken, setGogToken] = useState("");

  // The key is saved encrypted on the server at sync time; a copy in browser storage would be readable by any script.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_XBOX_API_KEY_STORAGE);
    } catch (e: unknown) {
      console.warn("Could not clear the legacy Xbox API key:", e);
    }
  }, []);

  useEffect(() => {
    if (steamAccount?.username && !steamInput) setSteamInput(steamAccount.username);
  }, [steamAccount?.username]);

  useEffect(() => {
    if (initialSteamApiKey && !steamApiKey) setSteamApiKey(initialSteamApiKey);
  }, [initialSteamApiKey]);

  useEffect(() => {
    if (xboxAccount?.username && !xboxInput) setXboxInput(xboxAccount.username);
  }, [xboxAccount?.username]);

  useEffect(() => {
    if (epicAccount?.username && !epicInput) setEpicInput(epicAccount.username);
  }, [epicAccount?.username]);

  useEffect(() => {
    if (gogAccount?.username && !gogInput) setGogInput(gogAccount.username);
  }, [gogAccount?.username]);

  return {
    steamInput, setSteamInput, steamApiKey, setSteamApiKey,
    xboxInput, setXboxInput, xboxApiKey, setXboxApiKey,
    epicInput, setEpicInput, epicCode, setEpicCode,
    gogInput, setGogInput, gogToken, setGogToken,
  };
}
