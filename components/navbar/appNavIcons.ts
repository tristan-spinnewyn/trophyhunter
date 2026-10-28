// components/navbar/appNavIcons.ts

import { Gamepad2, Link2, type LucideIcon } from "lucide-react";
import type { AppNavItemId } from "@/lib/navigation/app-nav";

export const APP_NAV_ICONS: Readonly<Record<AppNavItemId, LucideIcon>> = {
  library: Gamepad2,
  accounts: Link2,
};
