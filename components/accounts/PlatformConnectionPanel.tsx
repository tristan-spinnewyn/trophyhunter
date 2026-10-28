// components/accounts/PlatformConnectionPanel.tsx
"use client";

import type { ReactNode } from "react";
import {
  Award, CheckCircle2, ChevronDown, Edit3, ExternalLink, Gamepad2, KeyRound,
  Loader2, RefreshCw, Sparkles, Trophy, Unlink,
} from "lucide-react";
import type { PlatformAccount, PlatformType } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import { sanitizeExternalHref } from "@/lib/security/url-validator";
import {
  PLATFORM_CONNECTIONS,
  canStartSync,
  describeConnection,
  getPlatformSpecificStat,
} from "@/lib/accounts/platform-connection";
import { StatTileGrid, type StatTile } from "@/components/stats/StatTileGrid";
import { PlatformCollectionLink } from "./PlatformCollectionLink";

export interface PlatformConnectionPanelProps {
  readonly platform: PlatformType;
  readonly account?: PlatformAccount;
  readonly gameCount: number;
  readonly identifier: string;
  readonly onIdentifierChange: (value: string) => void;
  readonly secret: string;
  readonly onSecretChange: (value: string) => void;
  readonly isSyncing: boolean;
  readonly syncProgressText: string | null;
  readonly onSync: () => void;
  readonly onEdit: (platform: PlatformType) => void;
  readonly onDisconnect: (platform: PlatformType) => void;
  /** Epic: opens the guided authorization dialog. */
  readonly onOpenGuidedAuth?: () => void;
  /** Platform-specific tools shown under the stats. */
  readonly extra?: ReactNode;
}

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500";

/** One connection flow for every platform: identify, optionally authorize, sync, see the result. */
export function PlatformConnectionPanel({
  platform, account, gameCount, identifier, onIdentifierChange, secret, onSecretChange,
  isSyncing, syncProgressText, onSync, onEdit, onDisconnect, onOpenGuidedAuth, extra,
}: PlatformConnectionPanelProps) {
  const meta = PLATFORM_META[platform];
  const config = PLATFORM_CONNECTIONS[platform];
  const connection = describeConnection(account);
  const canSync = canStartSync(platform, identifier, isSyncing);
  const avatarUrl = sanitizeExternalHref(account?.avatarUrl);
  const profileUrl = sanitizeExternalHref(account?.profileUrl);
  const identifierId = `${platform}-identifier`;
  const secretId = `${platform}-secret`;

  const specific = getPlatformSpecificStat(platform, account);
  const tiles: StatTile[] = [
    { label: "Dans ta collection", value: gameCount, icon: Gamepad2, iconClass: "text-sky-400" },
    { label: "Succès débloqués", value: account?.stats.totalAchievements ?? 0, icon: Award, iconClass: "text-emerald-400" },
    { label: "Jeux à 100 %", value: account?.stats.completedGames ?? 0, icon: Trophy, iconClass: "text-amber-400" },
    ...(specific ? [{ ...specific, icon: Sparkles, iconClass: "text-slate-400" }] : []),
  ];

  return (
    <section className="space-y-4">
      <PlatformCollectionLink platform={platform} gameCount={gameCount} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-start gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                <Gamepad2 className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-semibold text-white">
                  {connection.name ?? meta.name}
                </h2>
                {connection.isLinked ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Lié
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Non lié</span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-400">
                {connection.lastSyncLabel ?? config.description}
              </p>
              {profileUrl && (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
                >
                  Voir le profil {meta.shortName} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1 border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => onEdit(platform)}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <Edit3 className="h-3.5 w-3.5" /> Modifier à la main
            </button>
            {connection.isLinked && (
              <button
                type="button"
                onClick={() => onDisconnect(platform)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-rose-300"
              >
                <Unlink className="h-3.5 w-3.5" /> Délier
              </button>
            )}
          </div>
        </div>

        <form
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSync) onSync();
          }}
        >
          <div>
            <label htmlFor={identifierId} className="text-sm font-medium text-slate-300">
              {config.identifierLabel}
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id={identifierId}
                type="text"
                value={identifier}
                onChange={(e) => onIdentifierChange(e.target.value)}
                placeholder={config.identifierPlaceholder}
                className={`${INPUT_CLASS} min-w-0 flex-1`}
              />
              <button
                type="submit"
                disabled={!canSync}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                {connection.isLinked ? "Synchroniser" : "Importer"}
              </button>
            </div>
          </div>

          {isSyncing && syncProgressText && (
            <p role="status" className="flex items-center gap-2 text-xs text-sky-300">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              <span className="truncate">{syncProgressText}</span>
            </p>
          )}

          <details className="group rounded-lg border border-slate-800" open={secret.length > 0}>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm text-slate-300 [&::-webkit-details-marker]:hidden">
              <KeyRound className="h-4 w-4 text-slate-500" />
              {config.secret.label}
              {secret && <span className="text-xs text-emerald-400">renseigné</span>}
              <ChevronDown className="ml-auto h-4 w-4 text-slate-500 transition group-open:rotate-180" />
            </summary>
            <div className="space-y-2 border-t border-slate-800 px-3 py-3">
              <p className="text-xs text-slate-400">{config.secret.hint}</p>
              <input
                id={secretId}
                type="password"
                aria-label={config.secret.label}
                value={secret}
                onChange={(e) => onSecretChange(config.secret.parse ? config.secret.parse(e.target.value) : e.target.value)}
                placeholder={config.secret.placeholder}
                className={`${INPUT_CLASS} font-mono text-xs`}
              />
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={config.secret.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
                >
                  {config.secret.helpLabel} <ExternalLink className="h-3 w-3" />
                </a>
                {onOpenGuidedAuth && (
                  <button
                    type="button"
                    onClick={onOpenGuidedAuth}
                    className="text-xs text-sky-400 hover:text-sky-300"
                  >
                    Me guider pas à pas
                  </button>
                )}
              </div>
            </div>
          </details>
        </form>
      </div>

      <StatTileGrid tiles={tiles} />

      {extra}
    </section>
  );
}
