import { useState } from "react";
import type { UserAccountProfile } from "@/lib/types";

interface UsePlatformInputsProps {
  accountProfile: UserAccountProfile;
  initialSteamApiKey?: string;
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
  const [xboxApiKey, setXboxApiKey] = useState("");
  const [showXboxApiKey, setShowXboxApiKey] = useState(false);

  const [epicInput, setEpicInput] = useState(epicAccount?.username || "");
  const [epicCode, setEpicCode] = useState("");
  const [showEpicCode, setShowEpicCode] = useState(false);

  const [gogInput, setGogInput] = useState(gogAccount?.username || "");
  const [gogToken, setGogToken] = useState("");
  const [showGogToken, setShowGogToken] = useState(false);

  return {
    steamInput,
    setSteamInput,
    steamApiKey,
    setSteamApiKey,
    showApiKeyInput,
    setShowApiKeyInput,
    xboxInput,
    setXboxInput,
    xboxApiKey,
    setXboxApiKey,
    showXboxApiKey,
    setShowXboxApiKey,
    epicInput,
    setEpicInput,
    epicCode,
    setEpicCode,
    showEpicCode,
    setShowEpicCode,
    gogInput,
    setGogInput,
    gogToken,
    setGogToken,
    showGogToken,
    setShowGogToken,
  };
}
