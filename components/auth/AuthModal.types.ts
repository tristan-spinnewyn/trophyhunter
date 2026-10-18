// components/auth/AuthModal.types.ts

import type { User as UserType } from "@/lib/types";

export interface AuthModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly currentUser: UserType | null;
  readonly onAuthSuccess: (user: UserType) => void;
  readonly onLogout: () => void;
}
