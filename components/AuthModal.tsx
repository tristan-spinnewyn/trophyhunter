// components/AuthModal.tsx
"use client";

import { X } from "lucide-react";
import type { AuthModalProps } from "./auth/AuthModal.types";
import { useAuthModalFlow } from "./auth/useAuthModalFlow";
import { AuthModalLoggedIn } from "./auth/AuthModalLoggedIn";
import { AuthModalForm } from "./auth/AuthModalForm";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

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
      </div>
    </div>
  );
}
