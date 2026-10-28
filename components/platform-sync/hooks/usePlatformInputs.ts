// components/platform-sync/hooks/usePlatformInputs.ts

import { useState, useEffect } from "react";
import type { UserAccountProfile } from "@/lib/types";

const XBOX_API_KEY_STORAGE = "trophyhunter_xbox_api_key";

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
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const [xboxInput, setXboxInput] = useState(xboxAccount?.username || "");
  const [xboxApiKey, setXboxApiKeyState] = useState("");
  const [showXboxApiKey, setShowXboxApiKey] = useState(false);

  const [epicInput, setEpicInput] = useState(epicAccount?.username || "");
  const [epicCode, setEpicCode] = useState("");
  const [showEpicCode, setShowEpicCode] = useState(false);

  const [gogInput, setGogInput] = useState(gogAccount?.username || "");
  const [gogToken, setGogToken] = useState("");
  const [showGogToken, setShowGogToken] = useState(false);

  const setXboxApiKey = (val: string) => {
    setXboxApiKeyState(val);
    if (typeof window !== "undefined") {
      try {
        if (val.trim()) localStorage.setItem(XBOX_API_KEY_STORAGE, val.trim());
        else localStorage.removeItem(XBOX_API_KEY_STORAGE);
      } catch (e: unknown) {
        console.warn("Could not persist Xbox API key locally:", e);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !xboxApiKey) {
      try {
        const saved = localStorage.getItem(XBOX_API_KEY_STORAGE);
        if (saved) setXboxApiKeyState(saved);
      } catch (e: unknown) {
        console.warn("Could not read Xbox API key locally:", e);
      }
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
    steamInput, setSteamInput, steamApiKey, setSteamApiKey, showApiKeyInput, setShowApiKeyInput,
    xboxInput, setXboxInput, xboxApiKey, setXboxApiKey, showXboxApiKey, setShowXboxApiKey,
    epicInput, setEpicInput, epicCode, setEpicCode, showEpicCode, setShowEpicCode,
    gogInput, setGogInput, gogToken, setGogToken, showGogToken, setShowGogToken,
  };
}
