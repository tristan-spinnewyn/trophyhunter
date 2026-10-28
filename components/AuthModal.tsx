// components/AuthModal.tsx
"use client";
import { Modal } from "./ui/Modal";
import { useAuthModalFlow } from "./auth/useAuthModalFlow";
import { AuthModalLoggedIn } from "./auth/AuthModalLoggedIn";
import { AuthModalForm } from "./auth/AuthModalForm";
import type { User as UserType } from "@/lib/types";

export interface AuthModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly currentUser: UserType | null;
  readonly onAuthSuccess: (user: UserType) => void;
  readonly onLogout: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onLogout,
}: AuthModalProps) {
  const flow = useAuthModalFlow({ onAuthSuccess, onLogout, onClose });

  if (!isOpen) return null;

  return (
    <Modal
      title={currentUser ? "Mon compte" : flow.mode === "login" ? "Connexion" : "Créer un compte"}
      onClose={onClose}
      size="sm"
    >
      {currentUser ? (
        <AuthModalLoggedIn
          currentUser={currentUser}
          successMsg={flow.successMsg}
          isLoading={flow.isLoading}
          onLogout={flow.handleLogout}
          onClose={onClose}
        />
      ) : (
        <AuthModalForm
          mode={flow.mode}
          setMode={flow.setMode}
          username={flow.username}
          setUsername={flow.setUsername}
          password={flow.password}
          setPassword={flow.setPassword}
          displayName={flow.displayName}
          setDisplayName={flow.setDisplayName}
          isLoading={flow.isLoading}
          errorMsg={flow.errorMsg}
          successMsg={flow.successMsg}
          onSubmit={flow.handleSubmit}
        />
      )}
    </Modal>
  );
}
