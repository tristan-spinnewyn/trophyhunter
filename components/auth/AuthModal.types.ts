// components/auth/AuthModal.types.ts

import type { User as UserType } from "@/lib/types";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onAuthSuccess: (user: UserType) => void;
  onLogout: () => void;
  onSyncLocalData?: () => Promise<void>;
}
