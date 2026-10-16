"use client";

import { useState, useEffect } from "react";
import {
  X,
  Download,
  Upload,
  Smartphone,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
  User,
  RefreshCw,
} from "lucide-react";
import { exportAllData, importAllData, getSavedSteamUser, saveSteamUser } from "@/lib/storage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
  onSteamUserSaved?: (user: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onDataReset,
  onSteamUserSaved,
}: SettingsModalProps) {
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [steamUser, setSteamUser] = useState("");
  const [steamSaved, setSteamSaved] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setSteamUser(getSavedSteamUser());
  }, [isOpen]);

  const handleSaveSteamUser = () => {
    saveSteamUser(steamUser);
    setSteamSaved(true);
    if (onSteamUserSaved) onSteamUserSaved(steamUser);
    setStatusMsg({ type: "success", text: "Profil Steam enregistré !" });
    setTimeout(() => setSteamSaved(false), 2500);
  };

  if (!isOpen) return null;

  const handleExport = () => {
    const data = exportAllData();
    navigator.clipboard.writeText(data);
    setCopied(true);
    setStatusMsg({ type: "success", text: "Données copiées dans le presse-papier !" });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trophyhunter-sauvegarde-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: "success", text: "Fichier de sauvegarde téléchargé !" });
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importAllData(importText);
    if (ok) {
      setStatusMsg({ type: "success", text: "Données importées avec succès ! Rechargement..." });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setStatusMsg({ type: "error", text: "Format JSON invalide. Vérifiez vos données." });
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        "ATTENTION : Cette action supprimera définitivement toute votre progression et vos notes locales. Confirmer ?"
      )
    ) {
      localStorage.clear();
      onDataReset();
      setStatusMsg({ type: "success", text: "Toutes les données ont été réinitialisées." });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Paramètres & Sauvegarde
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status message */}
        {statusMsg && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-xl p-3 text-xs ${
              statusMsg.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {statusMsg.type === "success" ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="mt-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Steam Public Profile Sync (No API Key Required) */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <User className="h-4 w-4" />
              Synchronisation automatique sans clé API
            </h3>
            <p className="mt-1 text-xs text-slate-300">
              Si votre profil Steam et vos <strong>« Détails des jeux »</strong> sont en <strong>Public</strong>, l&apos;application peut cocher automatiquement vos succès débloqués !
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={steamUser}
                onChange={(e) => setSteamUser(e.target.value)}
                placeholder="Ex: gabelogannewell ou 76561198..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSaveSteamUser}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
              >
                {steamSaved ? <Check className="h-3.5 w-3.5" /> : null}
                Enregistrer
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Vous pouvez entrer votre <strong>SteamID64</strong>, votre <strong>pseudo personnalisé</strong> ou l&apos;URL complète de votre profil.
            </p>
          </div>

          {/* Mobile Install (PWA) Guide */}
          <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
              <Smartphone className="h-4 w-4" />
              Installer sur votre smartphone
            </h3>
            <p className="mt-1 text-xs text-slate-300">
              Pour utiliser TrophyHunter comme une vraie application sur votre mobile :
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-400 list-disc list-inside">
              <li>
                <span className="font-semibold text-white">iPhone / iPad (Safari) :</span> Appuyez sur le bouton de partage (icône carré avec flèche vers le haut) puis sur{" "}
                <span className="text-sky-300 font-medium">« Sur l&apos;écran d&apos;accueil »</span>.
              </li>
              <li>
                <span className="font-semibold text-white">Android (Chrome) :</span> Appuyez sur les 3 points en haut à droite puis sur{" "}
                <span className="text-sky-300 font-medium">« Installer l&apos;application »</span>.
              </li>
            </ul>
          </div>

          {/* Backup & Sync */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sauvegarde de vos succès et notes
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Download className="h-3.5 w-3.5" />}
                Copier les données (JSON)
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                Télécharger le fichier .json
              </button>
            </div>

            {/* Import box */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-medium text-slate-400">
                Restaurer des données :
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Collez ici votre code JSON exporté..."
                rows={2}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-sky-500 font-mono"
              />
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:opacity-40"
              >
                <Upload className="h-3.5 w-3.5" />
                Importer et appliquer
              </button>
            </div>
          </div>

          {/* Reset All */}
          <div className="border-t border-slate-800 pt-3">
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Effacer toutes les données locales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
