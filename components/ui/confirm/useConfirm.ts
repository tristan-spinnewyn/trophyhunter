// components/ui/confirm/useConfirm.ts

import { createContext, useContext } from "react";
import type { ConfirmOptions } from "./useConfirmQueue";

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Asks the user to confirm an action in an in-app dialog; resolves to their answer. */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}
