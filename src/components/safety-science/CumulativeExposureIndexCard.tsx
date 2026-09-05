"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  Flame,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Wind,
  Layers,
  Info,
} from "lucide-react";
import { EnergyCategory } from "@/lib/types";

interface CumulativeExposureIndexCardProps {
  cei: number;
  status: "controlled" | "elevated" | "critical_storm";
  velocity14d: number;
  clusterStorm: boolean;
  dominantEnergy?: EnergyCategory | null;
  directBarrierFailureRate?: number;
  siteName?: string;
  compact?: boolean;
}

export default function CumulativeExposureIndexCard({
  cei,
  status,
  velocity14d,
  clusterStorm,
  dominantEnergy,
  directBarrierFailureRate = 0,
  siteName = "Asset-Wide Facility",
  compact = false,
}: CumulativeExposureIndexCardProps) {
  const isStorm = clusterStorm || status === "critical_storm";
  const isElevated = status === "elevated";

  const statusConfig = {
    critical_storm: {
      label: "Precursor Cluster Storm",
      badge: "border-rose-500/50 bg-rose-500/20 text-rose-300 ring-1 ring-rose-500",
      description: "Severe cluster density accumulation. Immediate supervisor stand-down advised.",
      color: "#f43f5e",
    },
    elevated: {
      label: "Elevated Exposure Accumulation",
      badge: "border-amber-500/50 bg-amber-500/20 text-amber-300",
      description: "14-day rolling precursor density trending upward. Targeted audits recommended.",
      color: "#f59e0b",
    },
    controlled: {
      label: "Controlled Exposure Baseline",
      badge: "border-emerald-500/50 bg-emerald-500/20 text-emerald-300",
      description: "Precursor arrival rate within standard operating bounds.",
      color: "#10b981",
    },
  }[status] || {
    label: "Controlled",
    badge: "border-slate-500/50 bg-slate-500/20 text-slate-300",
    description: "Standard parameters.",
    color: "#64748b",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border p-4 transition-all ${
        isStorm
          ? "border-rose-500/50 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.15)]"
          : isElevated
          ? "border-amber-500/40 bg-amber-950/15"
          : "border-surface-border bg-surface-card"
      }`}
    >
      {/* Pulse effect if cluster storm */}
      {isStorm && (
        <div className="absolute right-0 top-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-rose-500/20 blur-xl animate-pulse" />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded ${
                isStorm
                  ? "bg-rose-500/20 text-rose-400"
                  : isElevated
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-bold text-slate-100">
              Cumulative Exposure Index (CEI)
            </h3>
            <span className="rounded border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-indigo-400">
              EPRI Science
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            14-day rolling precursor density & cluster storm velocity for {siteName}
          </p>
        </div>

        {/* Status Badge */}
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold ${statusConfig.badge}`}
        >
          {isStorm ? (
            <Wind className="h-3.5 w-3.5 animate-spin text-rose-400" />
          ) : isElevated ? (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          )}
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* Main Metric Row */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* CEI Score */}
        <div className="rounded-md border border-surface-border bg-surface/50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Rolling CEI Score
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className="font-mono text-2xl font-bold"
              style={{ color: statusConfig.color }}
            >
              {cei}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(cei, 100)}%`,
                backgroundColor: statusConfig.color,
              }}
            />
          </div>
        </div>

        {/* Precursor Velocity */}
        <div className="rounded-md border border-surface-border bg-surface/50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            14-Day Velocity
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-slate-100">
              {velocity14d}
            </span>
            <span className="text-[11px] text-slate-400">precursors/day</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            Threshold: &gt;2.5 triggers storm
          </p>
        </div>

        {/* Barrier Failure Rate */}
        <div className="rounded-md border border-surface-border bg-surface/50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Direct Barrier Failure
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-rose-400">
              {directBarrierFailureRate}%
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            Absent or broken direct barriers
          </p>
        </div>

        {/* Dominant Energy Category */}
        <div className="rounded-md border border-surface-border bg-surface/50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Dominant Energy
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="font-mono text-base font-bold text-amber-400">
              {dominantEnergy || "Gravity"}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            Primary physical release hazard
          </p>
        </div>
      </div>

      {/* Narrative warning */}
      <div className="mt-3 flex items-start gap-2 text-xs text-slate-300">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <p className="leading-relaxed">
          {statusConfig.description}
        </p>
      </div>
    </div>
  );
}
