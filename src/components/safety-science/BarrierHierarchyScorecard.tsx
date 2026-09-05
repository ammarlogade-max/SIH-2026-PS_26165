"use client";

import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { BarrierAssessment, ControlHierarchyLevel, DirectControlStatus } from "@/lib/types";

interface BarrierHierarchyScorecardProps {
  assessment?: BarrierAssessment | null;
  weakControlWarning?: boolean;
}

const HIERARCHY_LEVELS: {
  level: ControlHierarchyLevel;
  rank: number;
  type: "Direct" | "Administrative" | "PPE";
  desc: string;
  reliability: "High Reliability (Physical)" | "Low Reliability (Human Dependency)" | "Lowest Reliability (Passive)";
}[] = [
  {
    level: "Elimination",
    rank: 1,
    type: "Direct",
    desc: "Physically remove the hazard or decommission hazardous source",
    reliability: "High Reliability (Physical)",
  },
  {
    level: "Substitution",
    rank: 2,
    type: "Direct",
    desc: "Replace hazardous material or equipment with non-hazardous alternative",
    reliability: "High Reliability (Physical)",
  },
  {
    level: "Engineering / Direct Control",
    rank: 3,
    type: "Direct",
    desc: "Physical barriers, mechanical interlocks, LOTO isolation, pressure relief",
    reliability: "High Reliability (Physical)",
  },
  {
    level: "Administrative",
    rank: 4,
    type: "Administrative",
    desc: "Work procedures, permits to work, toolbox talks, warning signs, training",
    reliability: "Low Reliability (Human Dependency)",
  },
  {
    level: "PPE",
    rank: 5,
    type: "PPE",
    desc: "Helmets, harnesses, safety glasses, gloves, respirators",
    reliability: "Lowest Reliability (Passive)",
  },
];

const statusStyles: Record<
  DirectControlStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  absent: {
    label: "Barrier Absent",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/40",
    icon: XCircle,
  },
  failed: {
    label: "Barrier Failed",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/40",
    icon: AlertTriangle,
  },
  bypassed: {
    label: "Barrier Bypassed",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/40",
    icon: AlertTriangle,
  },
  intact: {
    label: "Barrier Intact",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    icon: CheckCircle2,
  },
};

export default function BarrierHierarchyScorecard({
  assessment,
  weakControlWarning = false,
}: BarrierHierarchyScorecardProps) {
  if (!assessment) {
    return (
      <div className="rounded-lg border border-dashed border-surface-border bg-surface/30 p-4 text-center">
        <Sliders className="mx-auto h-6 w-6 text-slate-500" />
        <p className="mt-2 text-xs font-semibold text-slate-300">
          Barrier Integrity Scorecard
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Run observation through Layer A/B classifier to evaluate Hierarchy of Controls.
        </p>
      </div>
    );
  }

  const {
    direct_control_status,
    compromised_level,
    hierarchy_rank,
    identified_barrier,
    barrier_description,
    control_reliability,
    reliability_score,
    weak_control_flag,
    recommended_direct_control,
  } = assessment;

  const currentBarrierText = identified_barrier || barrier_description || "Identified barrier";
  const currentReliability = control_reliability ?? reliability_score ?? 50;
  const currentStatus = statusStyles[direct_control_status] || statusStyles.absent;
  const StatusIcon = currentStatus.icon;
  const isWeak = weak_control_flag || weakControlWarning;

  return (
    <div className="rounded-lg border border-surface-border bg-surface-card p-4 transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/20 text-indigo-400">
              <Sliders className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-bold text-slate-100">
              Direct vs. Admin Barrier Scoring
            </h3>
            <span className="rounded border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-indigo-400">
              Hierarchy of Controls
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Enforces high-reliability engineering CAPAs over weak administrative reminders
          </p>
        </div>

        {/* Status Badge */}
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold ${currentStatus.border} ${currentStatus.bg} ${currentStatus.text}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          <span>{currentStatus.label}</span>
          <span className="opacity-75">({control_reliability})</span>
        </div>
      </div>

      {/* Weak Control Warning Banner */}
      {isWeak && (
        <div className="mt-3 flex items-start gap-2.5 rounded-md border border-amber-500/40 bg-amber-500/15 p-3 text-xs text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="min-w-0">
            <p className="font-bold text-amber-300">
              Weak Control Warning: SIF Precursor Relying on Low-Reliability Measures
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-amber-200/90">
              Administrative controls (toolbox talks, reminders, warnings) or PPE alone fail to prevent SIF events under CSRA benchmarks. Direct physical isolation or engineering interlocks are required.
            </p>
          </div>
        </div>
      )}

      {/* Hierarchy Step Visualizer */}
      <div className="mt-4 space-y-2">
        {HIERARCHY_LEVELS.map((item) => {
          const isCurrentRank = item.rank === hierarchy_rank;
          const isDirect = item.type === "Direct";

          return (
            <div
              key={item.level}
              className={`flex items-center justify-between rounded-md border p-2.5 text-xs transition-all ${
                isCurrentRank
                  ? isDirect
                    ? "border-emerald-500/60 bg-emerald-500/15 ring-1 ring-emerald-500"
                    : "border-amber-500/60 bg-amber-500/15 ring-1 ring-amber-500"
                  : "border-surface-border bg-surface/40 opacity-70"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded font-mono text-xs font-bold ${
                    isCurrentRank
                      ? isDirect
                        ? "bg-emerald-500 text-slate-900"
                        : "bg-amber-500 text-slate-900"
                      : "bg-surface-raised text-slate-400"
                  }`}
                >
                  {item.rank}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">{item.level}</span>
                    <span
                      className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold ${
                        isDirect
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {item.type === "Direct" ? "DIRECT CONTROL (HIGH)" : "ADMIN / PASSIVE (LOW)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>
              </div>

              {isCurrentRank && (
                <span className="shrink-0 font-mono text-[10px] font-bold uppercase text-amber-400">
                  Compromised Rank
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Identified Barrier & Recommended Direct Control */}
      <div className="mt-4 grid grid-cols-1 gap-3 rounded-md border border-slate-700/80 bg-surface-raised p-3 text-xs sm:grid-cols-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Identified Barrier in Observation
          </p>
          <p className="mt-1 font-medium text-slate-200">
            {currentBarrierText}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
            Recommended High-Reliability Direct CAPA
          </p>
          <p className="mt-1 font-medium text-emerald-300">
            {recommended_direct_control}
          </p>
        </div>
      </div>

      {/* Footer Benchmark Note */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Info className="h-3 w-3 text-slate-500" />
          NIOSH / OSHA Hierarchy of Controls enforcement standard.
        </span>
        <span className="font-mono text-[10px] text-slate-400">
          Rank: {hierarchy_rank} / 5
        </span>
      </div>
    </div>
  );
}
